const bluebird = require("bluebird");

const fs = bluebird.promisifyAll(require("fs"));
const readline = require("readline");
const { URL } = require("url");
const { Transform } = require("stream");

const { parse } = require("tldjs");
const axios = require("axios");
const logger = require("./logger");
const makeParser = require("./parser");

const domainWhitelist = new Set(["reddit"]);

async function addToFrontier(newHref) {
  if (!newHref) {
    logger.unexpectError("anchor with href??");
    return;
  }
  const url = parse(newHref);
  if (domainWhitelist.has(url.domain) && !alreadySeen.has(newHref)) {
    try {
      alreadySeen.add(newHref);
      await fs.appendFileAsync("../frontier.txt", newHref + "\n");
    } catch (err) {
      logger.unexpectError(err);
    }
  }
}

class Crawler {
  constructor() {
    this.connections = 0;
    this.total_GETs = 0;
    this.finalizeCrawl = this.finalizeCrawl.bind(this);
    this.addToFrontier = this.addToFrontier.bind(this);
    this.parsedUrls = new Set();
    this.currentlyScrapingUrls = new Set();
    this.frontier = [];
    this.frontierPointer = 0;
    this.politeToScrape = {};
    this.initializeFrontier();
  }

  initializeFrontier() {
    if (process.argv[2]) {
      this.frontier.push(process.argv[2]);
    } else {
      this.frontier.push("https://en.wikipedia.org/wiki/U.S._state", "https://www.reddit.com/r/AskReddit/");
    }
    // return bluebird.map(domainWhitelist.entries(), domain => fs.appendFileAsync('../frontier.txt', url + '\n'))
  }

  maintainConnnections() {
    while (this.connections < 25) {
      //We absolutely need to do this to avoid accidentally blocking the event loop
      this.crawlNext();
      if (this.endOfFrontier()) {
        this.frontierPointer = 0;
        return
      }
    }
  }

  crawlNext() {
    while (!this.endOfFrontier() && this.shouldNotScrapeUrl(this.peekNextUrl())) {
      this.frontierPointer++;
    }
    if (this.endOfFrontier() && !this.frontierIsEmpty()) {
      return
    }
    this.connections++;
    const nextUrl = this.getNextUrl();
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
    return this.parsedUrls.has(url);
  }

  currentlyScrapingUrl(url) {
    return this.currentlyScrapingUrls.has(url);
  }

  endOfFrontier() {
    return this.frontierPointer === this.frontier.length;
  }

  frontierIsEmpty() {
    this.frontier.length === 0;
  }

  getNextUrl() {
    const url = this.peekNextUrl();
    this.frontier.slice(this.frontierPointer, 1);
    this.frontierPointer++;
    return url;
  }

  peekNextUrl() {
    return this.frontier[this.frontierPointer];
  }

  finalizeCrawl(url) {
    logger.finalizingCrawl(url);
    this.connections--;
    this.parsedUrls.add(url);
    this.currentlyScrapingUrls.delete(url);
  }

  addToFrontier({ fromUrl, newUrl }) {
    logger.addingToFrontier({ fromUrl, newUrl });
    if (this.currentlyScrapingUrl(newUrl)) return;
    if (this.urlHasBeenScraped(newUrl)) return;
    this.frontier.push(newUrl);
  }

  updatePolitenessTracker(url) {
    // polite to scrape domain again after 120 seconds
    const domain = parse(url).domain;
    this.politeToScrape[domain] = Date.now() + 120 * 1000;
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
        parser.once("finished", this.finalizeCrawl);
        parser.on("new link", this.addToFrontier);
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