/* Initially, I considered storing all of the urls for all of the domains in a single file.
Retrieving the next URL in the frontier would simply be a matter of iterating over the file
until a domain was found that could be politely crawled (it hadn't been crawled recently).
I decided against the strategy for two reasons

1. This file would be long. We're talking a ~50,000,000 lines, one for every url.
Assuming every URL is 64 bytes (every line being 30 including new lines), this makes the file 3.2GB long.
Removing a line from the center of this file and rewriting it back to disk would be
be a taxing operation that we would repeat over and over again.

2. Before storing the frontier in a file, I stored it in memory. This was so I could get
a simple version of the program running before introducing additional asynchronicity.
In practice, I found that a large number of links were internal links. This meant that
when my frontier file contained large, contiguous chunks of urls from the same domain.
If one was not polite to crawl, nonw of them were. So I found traverse the file data structure
I found myself restarting at the beginning of the frontier, looping over it
over and over until a good domain was found. This process was not efficient, and it
would have been far worse if the frontier were in a file.

Issue number two made it abundantly clear that the process would be far more efficient if
the frontier was indexed by domain. Simple enough, I can just create a separate frontier
file for every domain.
*/

const bluebird = require("bluebird");
const fs = require("fs");
const mkdirp = require("mkdirp");
bluebird.promisifyAll(require("fs"));
const { getDomain } = require("tldjs");

const { join } = require("path");
const { FRONTIER_DIRECTORY, APPEND_FLUSH_TIME } = require("APP/env/");

class Frontier {
  constructor(seedDomain, logger, storage = fs) {
    this.domain = seedDomain;
    this.uncrawledUrlsInFrontier = 1;
    this.frontierIndex = 0;
    this.currentlyReading = false;
    this.queuedNewlinks = new Set();
    this.flushScheduled = false;
    this.storage = storage;
    this.logger = logger;
    this.filePaths = { root: "", frontier: "", frontierIndex: "" };

    this._setfilePaths(seedDomain);
    this._initializeFrontierFiles(seedDomain);
  }

  appendNewUrl(url) {
    const domain = getDomain(url);
    const domainTracker = this.domainTrackers.get(domain);
    // Only track a specific subset of domains on each server.
    // If a link is found to an unseeded domain, ignore it
    if (!domainTracker) return;

    domainTracker.appendNewUrl(url);
  }

  _setfilePaths(seedDomain) {
    if (seedDomain.startsWith("http://")) {
      const domain = seedDomain.split("http://")[1];
      this.filePaths.root = join(FRONTIER_DIRECTORY, domain);
    } else {
      this.filePaths.root = join(FRONTIER_DIRECTORY, seedDomain);
    }
    this.filePaths.frontier = join(this.filePaths.root, "frontier.txt");
    this.filePaths.frontierIndex = join(this.filePaths.root, "frontier-index.txt");
  }

  _initializeFrontierFiles(seedDomain) {
    const domainWithProtocol = seedDomain.startsWith("http://")
      ? seedDomain
      : `http://${seedDomain}`;
    mkdirp.sync(this.filePaths.root);

    let frontierExists;
    let fronterIndexExists;
    try {
      frontierExists = this.storage.existsSync(this.filePaths.frontier);
      fronterIndexExists = this.storage.existsSync(this.filePaths.frontierIndex);
    } catch (err) {
      this.logger.frontiers.frontierExistsCheckFailed(err);
    }
    if ((frontierExists && !fronterIndexExists) || (fronterIndexExists && !frontierExists)) {
      const error = new Error("cannot have frontier or frontier-index without the other");
      this.logger.frontiers.frontierFilesCorrupt(error, seedDomain);
      process.exit(1);
    }

    try {
      if (frontierExists && fronterIndexExists) {
        const frontierSize = this.storage
          .readFileSync(this.filePaths.frontier)
          .toString()
          .split("\n")
          .filter(url => url).length;
        this.frontierIndex = parseInt(
          this.storage.readFileSync(this.filePaths.frontierIndex).toString(),
          10
        );
        this.uncrawledUrlsInFrontier = frontierSize - this.frontierIndex;
        if (this.uncrawledUrlsInFrontier < 0) {
          const error = new Error("urls uncrawled cannot be less than 0");
          this.logger.frontiers.frontierFilesCorrupt(error, this.seedDomain);
          process.exit(1);
        }
      } else {
        this.storage.writeFileSync(this.filePaths.frontier, `${domainWithProtocol}\n`);
        this.storage.writeFileSync(this.filePaths.frontierIndex, 0);
      }
    } catch (err) {
      this.logger.frontiers.failedToReadFrontier(err, seedDomain);
    }
  }

  scheduleCompaction() {
    const threeHours = 1000 * 60 * 60 * 3;
    setInterval(() => {
      this._frontierCompaction();
    }, threeHours);
  }

  readyForReading() {
    return !this.isEmpty() && !this.currentlyReading;
  }

  isEmpty() {
    // Less than should never happen
    // console.log("urls left ", this.uncrawledUrlsInFrontier, this.frontierIndex);
    return this.uncrawledUrlsInFrontier <= 0;
  }

  async getNextUrl() {
    if (!this.readyForReading()) return "";

    let nextUrl;
    this.currentlyReading = true;

    try {
      console.log("before read url ", this.frontierIndex, this.uncrawledUrlsInFrontier);
      this.uncrawledUrlsInFrontier -= 1;
      const buffer = await this.storage.readFileAsync(this.filePaths.frontier);
      nextUrl = buffer.toString().split("\n")[this.frontierIndex];
      this.frontierIndex += 1;

      // We are able to return the url before this file is updated
      // Remove the lock when this completes
      this._flushFrontierIndex();
    } catch (err) {
      this.uncrawledUrlsInFrontier += 1;
      this.logger.frontiers.readUrlFailed(err, this.seedDomain);
      this.currentlyReading = false;
      nextUrl = "";
    }

    console.log("after read url ", this.frontierIndex, this.uncrawledUrlsInFrontier);

    console.log("url returned from frontier", nextUrl);
    if (nextUrl === undefined) {
      process.exit();
    }
    this.logger.frontiers.retrievedNextUrl(nextUrl);
    return nextUrl;
  }

  async _flushFrontierIndex() {
    if (!this.currentlyReading) {
      this.logger.frontiers.indexFlushedWithoutLock(this.filePaths);
      return;
    }

    try {
      await this.storage.writeFileAsync(this.filePaths.frontierIndex, this.frontierIndex);
    } catch (err) {
      // TODO how do we want to handle failure here?
      this.logger.frontiers.frontierIndexWriteFailure(err, this.domain);
    }

    this.currentlyReading = false;
  }

  append(newUrl) {
    this.queuedNewlinks.add(newUrl);

    // Often times we find many new links back to back on the same page
    // Queue them all at once
    if (!this.flushScheduled) {
      setTimeout(this.flushNewLinkQueue.bind(this), APPEND_FLUSH_TIME);
      this.flushScheduled = true;
    }
  }

  async flushNewLinkQueue() {
    if (!this.flushScheduled) {
      return;
    }

    const linksToAppend = [...this.queuedNewlinks.values()].join("\n");
    const numberToAppend = this.queuedNewlinks.size;
    if (!linksToAppend) {
      this.flushScheduled = false;
      return;
    }

    if (this.currentlyReading) {
      const fiveSeconds = 5 * 1000;
      setTimeout(this.flushNewLinkQueue.bind(this), fiveSeconds);
      return;
    }

    this.currentlyReading = true;
    try {
      console.log(
        `link queue flushed with ${this.queuedNewlinks.size}`,
        this.uncrawledUrlsInFrontier
      );
      this.queuedNewlinks = new Set();
      await this.storage.appendFileAsync(this.filePaths.frontier, `${linksToAppend}\n`);
      this.uncrawledUrlsInFrontier += numberToAppend;
    } catch (err) {
      this.queuedNewlinks = new Set(linksToAppend.split("\n"));
      this.logger.frontiers.appendUrlFailed(err, this.seedDomain);
    }
    this.currentlyReading = false;
    this.flushScheduled = false;
  }
}

module.exports = Frontier;
