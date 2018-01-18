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

const { join } = require("path");
const { FRONTIER_DIRECTORY } = require("APP/env/");

class Frontier {
  constructor(seedDomain, logger, storage = fs) {
    this.domain = seedDomain;
    this.uncrawledUrlsInFrontier = 1;
    this.frontierIndex = 0;
    this.currentlyReading = false;
    this.queuedNewlinks = [];
    this.flushScheduled = false;
    this.storage = storage;
    this.logger = logger;
    this.filePaths = { root: "", frontier: "", frontierIndex: "" };

    this._setfilePaths(seedDomain);
    this._initializeFrontierFiles(seedDomain);
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
    const domainWithProtocol = seedDomain.startsWith("http://") ? seedDomain : `http://${seedDomain}`;
    mkdirp.sync(this.filePaths.root);

    let frontierExists;
    let fronterIndexExists;
    try {
      frontierExists = this.storage.existsSync(this.filePaths.frontier);
      fronterIndexExists = this.storage.existsSync(this.filePaths.frontierIndex);
    } catch (err) {
      this.logger.frontier.frontierExistsCheckFailed(err);
    }
    if ((frontierExists && !fronterIndexExists) || (fronterIndexExists && !frontierExists)) {
      const error = new Error("cannot have frontier or frontier-index without the other");
      this.logger.frontier.frontierFilesCorrupt(error, seedDomain);
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
          this.logger.frontier.corruptFileConfiguration(error, this.seedDomain);
        }
      } else {
        this.storage.writeFileSync(this.filePaths.frontier, `${domainWithProtocol}\n`);
        this.storage.writeFileSync(this.filePaths.frontierIndex, 0);
      }
    } catch (err) {
      this.logger.frontier.failedToReadFrontier(err, seedDomain);
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
    return this.uncrawledUrlsInFrontier === 0;
  }

  async getNextUrl() {
    if (!this.readyForReading()) return "";

    let nextUrl;
    this.currentlyReading = true;

    try {
      this.uncrawledUrlsInFrontier -= 1;
      const buffer = await this.storage.readFileAsync(this.filePaths.frontier);
      nextUrl = buffer.toString().split("\n")[this.frontierIndex];
      this.frontierIndex += 1;
    } catch (err) {
      this.uncrawledUrlsInFrontier += 1;
      this.logger.frontier.readUrlFailed(err, this.seedDomain);
    }

    this._flushFrontierIndex();

    this.currentlyReading = false;
    return nextUrl;
  }

  async _flushFrontierIndex() {
    //Not about race conditions but about keeping track of file descriptors open
    if (!this.currentlyReading) return;

    this.currentlyReading = true;

    try {
      await this.storage.writeFileAsync(this.filePaths.frontierIndex, this.frontierIndex);
    } catch (err) {
      this.logger.frontier.frontierIndexWriteFailure(err, this.domain);
    }

    this.currentlyReading = false;
  }

  append(newUrl) {
    this.queuedNewlinks.push(newUrl);
    const oneMinute = 60 * 1000;

    // Often times we find many new links back to back on the same page
    // Queue them all at once
    if (!this.flushScheduled) {
      setTimeout(this.flushNewLinkQueue.bind(this), oneMinute);
      this.flushScheduled = true;
    }
  }

  async flushNewLinkQueue() {
    if (!this.flushScheduled) {
      return;
    }
    const linksToAppend = this.queuedNewlinks.join("\n");
    if (!linksToAppend) {
      this.flushScheduled = false;
      return;
    }

    if (this.currentlyReading) {
      const fiveSeconds = 5 * 1000;
      setTimeout(this.flushNewLinkQueue.bind(this), fiveSeconds);
      return;
    }

    // This flag is not to protect against a race condition but rather
    // so that the crawler can keep tabs on the number of open files
    // to avoid exceeding unix file open limits
    this.currentlyReading = true;
    try {
      await this.storage.appendFileAsync(this.filePaths.frontier, `${linksToAppend}\n`);
      this.uncrawledUrlsInFrontier += this.queuedNewlinks.length;
      this.queuedNewlinks = [];
    } catch (err) {
      console.log("err", err);
      this.logger.frontier.appendUrlFailed(err, this.seedDomain);
    }
    this.currentlyReading = false;
    this.flushScheduled = false;
  }
}

module.exports = Frontier;
