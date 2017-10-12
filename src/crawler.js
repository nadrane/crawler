
const readline = require("readline");
const { URL } = require("url");
const { Transform } = require("stream");

const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));
const { BloomFilter } = require('bloomfilter');
const { parse } = require("tldjs");
const axios = require("axios");

const Frontier = require('./frontier');
const logger = require("./logger");
const makeParser = require("./parser");


const domainWhitelist = new Set(["reddit"]);

class Crawler {
  constructor() {
    this.connections = 0;
    this.total_GETs = 0;
    this.finalizeCrawl = this.finalizeCrawl.bind(this);
     // Allocating 9.6 bits per url and assuming a false positive rate of 1%
     // meaning
     // If we return false, then the URL has definitely not been scraped
     // If we return true, then the URL is 99% likely to have been scraped
     // This means we will accidentally skip 1% of urls.
    this.parsedUrls = new BloomFilter(9.6 * 25000000, 7)
    this.currentlyScrapingUrls = new Set();

    this.politeToScrape = {};
    this.frontier = new Frontier(["https://en.wikipedia.org/wiki/U.S._state", "https://www.reddit.com/r/AskReddit/"]);
  }

  maintainConnnections() {
    while (this.connections < 25) {
      //We absolutely need to do this to avoid accidentally blocking the event loop
      this.crawlNext();
      if (this.frontier.isAtEnd()) {
        this.frontier.reset();
        return
      }
    }
  }

  crawlNext() {
    while (!this.frontier.isAtEnd() && this.shouldNotScrapeUrl(this.frontier.peekNextUrl())) {
      this.frontier.skipToNextUrl();
    }
    if (this.frontier.isAtEnd() && !this.frontier.isEmpty()) {
      return
    }
    this.connections++;
    const nextUrl = this.frontier.getNextUrl();
    this.currentlyScrapingUrls.add(nextUrl);
    this.updatePolitenessTracker(nextUrl);
    this.crawlWithGetRequest(nextUrl);
  }

  shouldNotScrapeUrl(url) {
    const domain = parse(url).domain;
    return (
      this.currentlyScrapingUrl(url) ||
      this.urlHasBeenScraped(url) ||
      this.domainWasScrapedRecently(domain)
    );
  }

  domainWasScrapedRecently(domain) {
    return (this.politeToScrape[domain] || false) && this.politeToScrape[domain] > Date.now();
  }

  urlHasBeenScraped(url) {
    return this.parsedUrls.test(url);
  }

  currentlyScrapingUrl(url) {
    return this.currentlyScrapingUrls.has(url);
  }

  finalizeCrawl(url) {
    logger.finalizingCrawl(url);
    this.connections--;
    this.parsedUrls.add(url);
    this.currentlyScrapingUrls.delete(url);
  }

  updatePolitenessTracker(url) {
    // polite to scrape domain again after 120 seconds
    const domain = parse(url).domain;
    this.politeToScrape[domain] = Date.now() + 120 * 1000;
  }

  newLinkFound({fromUrl, newUrl}) {
    if (this.currentlyScrapingUrl(newUrl)) return;
    if (this.urlHasBeenScraped(newUrl)) return;
    logger.addingToFrontier(fromUrl, newUrl);
    this.frontier.append(newUrl)
  }

  crawlWithGetRequest(url) {
    logger.GETRequestSent(url);
    axios({
      method: "get",
      url,
      responseType: "stream"
    })
      .then(res => {
        logger.GETResponseReceived(url, res.status)
        this.total_GETs++;
        const parser = new makeParser(url);
        parser.once("finished", this.finalizeCrawl.bind(this));
        parser.on("new link", this.newLinkFound.bind(this));
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
setInterval(crawler.maintainConnnections.bind(crawler), 5000)

// But kick off the crawler immediately this one time
process.nextTick(crawler.maintainConnnections.bind(crawler))