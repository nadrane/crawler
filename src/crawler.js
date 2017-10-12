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

class Crawler {
  constructor() {
    this.connections = 0;
    this.totalRequestsMade = 0;
    this.totalResponsesParsed = 0;
    this.maxConnections = 100;
    this.finalizeCrawl = this.finalizeCrawl.bind(this);
    // Allocating 9.6 bits per url and assuming a false positive rate of 1%
    // meaning
    // If we return false, then the URL has definitely not been scraped
    // If we return true, then the URL is 99% likely to have been scraped
    // This means we will accidentally skip 1% of urls.
    this.parsedUrls = new BloomFilter(9.6 * 25000000, 7);
    this.currentlyScrapingUrls = new Set();
    this.domainTrackers = new Map();
    this.seedDomains();
  }

  seedDomains() {
    truncateSync('./logs/error.txt');
    truncateSync('./logs/info.txt');
    readFileSync("./seed-domains.txt")
      .toString()
      .split("\n")
      .map(domain => this.domainTrackers.set(domain, new DomainTracker(domain)));
  }

  // Returns the first domain that can be politely scrapped
  getDomainToScrape() {
    for (let [domain, domainTracker] of this.domainTrackers) {
      if (domainTracker.politeToScrape()) {
        return domain;
      }
    }
  }

  maintainConnnections() {
    while (this.connections < this.maxConnections) {
      const domain = this.getDomainToScrape();
      if (!domain) break; //We absolutely need to do this to avoid accidentally blocking the event loop
      this.crawlNextInDomain(domain);
    }
  }

  async crawlNextInDomain(domain) {
    this.domainTrackers.get(domain).updateTimeLastScraped();
    this.connections++;
    // We want to do the async operation as late as possible to avoid opening excessive connections
    // and potentially opening multiple connections to a single domain.
    const nextUrl = await this.domainTrackers.get(domain).frontier.getNextUrl();
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

  newLinkFound({ fromUrl, newUrl }) {
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
      responseType: "stream"
    })
      .then(res => {
        logger.GETResponseReceived(url, res.status);
        const parser = new makeParser(url);
        parser.once("finished", this.finalizeCrawl.bind(this));
        parser.on("new link", this.newLinkFound.bind(this));
        parser.on("error", logger.parserError.bind(logger))
        res.data.pipe(parser);
      })
      .catch(err => {
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
  console.error(err);
});
