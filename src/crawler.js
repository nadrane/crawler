const readline = require("readline");
const { URL } = require("url");
const { Transform } = require("stream");

const bluebird = require("bluebird");
const { readFileSync, truncateSync } = require("fs");
const fs = bluebird.promisifyAll(require("fs"));
const { BloomFilter } = require("bloomfilter");
const { parse } = require("tldjs");
const axios = require("axios");

const DomainTracker = require("./domain-tracker");
const logger = require("./logger");
const makeParser = require("./parser");
const approvedByRobots = require("./robots-parser");
const { userAgent } = require("../env");

class Crawler {
  constructor() {
    this.connections = 0;
    this.totalRequestsMade = 0;
    this.totalResponsesParsed = 0;
    this.maxConnections = 2;
    this.finalizeCrawl = this.finalizeCrawl.bind(this);
    // Allocating 9.6 bits per url and assuming a false positive rate of 1%
    // meaning
    // If we return false, then the URL has definitely not been scraped
    // If we return true, then the URL is 99% likely to have been scraped
    // This means we will accidentally skip 1% of urls, an acceptable error
    // for this application.
    this.parsedUrls = new BloomFilter(9.6 * 25000000, 7);
    this.currentlyScrapingUrls = new Set();

    // IDEA heap/priority queue - would turn getDomainToScrape into O(logn) which might actually matter
    // if there are 100,000 whitelisted domains
    // IDEA generators or coroutines instead?
    this.domainTrackers = new Map();
    this.seedDomains();
  }

  seedDomains() {
    truncateSync("./logs/error.txt");
    truncateSync("./logs/info.txt");
    readFileSync("./seed-domains.txt")
      .toString()
      .split("\n")
      .map(domain => this.domainTrackers.set(domain, new DomainTracker(domain)));
  }

  maintainConnnections() {
    while (this.connections < this.maxConnections) {
      const domain = this.getDomainToScrape();
      if (!domain) break; //We absolutely need to do this to avoid accidentally blocking the event loop
      this.crawlNextInDomain(domain);
    }
  }

  // Returns the first domain that can be politely scrapped
  getDomainToScrape() {
    for (let [domain, domainTracker] of this.domainTrackers) {
      if (domainTracker.politeToScrape()) {
        return domain;
      }
    }
  }

  async crawlNextInDomain(domain) {
    // Just because the frontier is exhausted does not mean there isn't an
    // outstanding request scraping domains now. Don't remove domainTracker immediately.
    // Maybe come up with some way to do this in the future.
        //   this.domainTrackers.delete(domain);
    //   logger.domainExhausted(domain);
    //   return;
    // }
    const domainTracker = this.domainTrackers.get(domain)
    if (domainTracker.frontier.isEmpty()) return

    domainTracker.updateTimeLastScraped();
    // We want to do the async operation as late as possible to avoid opening excessive connections
    // and potentially opening multiple connections to a single domain.
    const nextUrl = await domainTracker.frontier.getNextUrl();

    // It might seem very inefficient to not do this check before inserting urls
    // into the frontier. It is. However, one of the core requirements of this
    // crawler is politeness, and if on a single page we find links to many
    // different subdomains of a single site (not unlikely), we will then
    // hammer that site because robotsTxt requests are not throttled. To avoid
    // coding in throttling code for robotsTxt requests, we will just do
    // the request here. At worst (when robotTxt caching doesn't come to the rescue),
    // we will send two back-to-back requests to one domain.
    if (!await approvedByRobots(nextUrl)) return;

    this.connections++;
    this.currentlyScrapingUrls.add(nextUrl);
    this.crawlWithGetRequest(nextUrl);
  }

  finalizeCrawl(url) {
    this.totalResponsesParsed++;
    logger.finalizingCrawl(url, this.totalResponsesParsed);
    this.connections--;
    this.markUrlAsParsed(url);
    this.currentlyScrapingUrls.delete(url);
  }

  markUrlAsParsed(url) {
    // Strip off the protocl. No need to scrap both http and https of the same site
    const massagedUrl = url.split("://")[1];
    if (!["http", "https"].includes(url.split("://")[0])) {
      logger.unexpectedError(`There should be no non http/s links ${url}`);
    }
    this.parsedUrls.add(massagedUrl);
  }

  async newLinkFound({ fromUrl, newUrl }) {
    if (this.shouldNotScrapeUrl(newUrl)) return;
    logger.addingToFrontier(fromUrl, newUrl);
    this.domainTrackers.get(parse(newUrl).domain).frontier.append(newUrl);
  }

  shouldNotScrapeUrl(url) {
    const domain = parse(url).domain;
    // Don't scrape a url we are currently scraping
    // Don't scrape a url twice
    // Do not scrape an unwhitelisted domain. Note that we *are* allowed to follow subdomains
    return (
      this.currentlyScrapingUrls.has(url) ||
      this.urlHasBeenScraped(url) ||
      !this.domainTrackers.get(domain)
    );
  }

  urlHasBeenScraped(url) {
    return this.parsedUrls.test(url);
  }

  crawlWithGetRequest(url) {
    this.totalRequestsMade++;
    logger.GETRequestSent(url, this.totalRequestsMade);
    axios({
      method: "get",
      url,
      responseType: "stream",
      headers: {
        userAgent
      }
    })
      .then(res => {
        logger.GETResponseReceived(url, res.status);
        const parser = new makeParser(url);
        parser.once("finished", this.finalizeCrawl.bind(this));
        parser.on("new link", this.newLinkFound.bind(this));
        parser.on("error", logger.parserError.bind(logger));
        res.data.pipe(parser);
      })
      .catch(err => {
        if (err.code === "ECONNRESET") {
          const { domain } = parse(url);
          const { frontier } = this.domainTrackers.get(domain);
          logger.connectionReset(url)
          frontier.append(url);
        }
        logger.GETResponseError(url, err, err.code);
        this.finalizeCrawl(url);
      });
  }
}

const crawler = new Crawler();

// Much easier than to just invoke on a continual basis than
// after certain events like a crawl finishing.
setInterval(crawler.maintainConnnections.bind(crawler), 5000);

// But kick off the crawler immediately this one time
process.nextTick(crawler.maintainConnnections.bind(crawler));

process.on("uncaughtException", function(err) {
  logger.unexpectedError(err);
});
