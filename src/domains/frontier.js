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

const assert = require('assert');
const bluebird = require("bluebird");
const fs = require("fs");
bluebird.promisifyAll(require("fs"));

const logger = require("APP/src/logger")();
const { join } = require("path");
const { FRONTIER_DIRECTORY } = require('APP/env/')

class Frontier {
  constructor(seedDomain) {
    this.domain = seedDomain;
    this.urlsInFrontier = 1
    this.currentlyReading = false
    this.queuedNewlinks = []
    this.flushScheduled = false

    this.fileName = join(FRONTIER_DIRECTORY, `${seedDomain}.txt`);

    if (!seedDomain.startsWith('http://')) {
      seedDomain = `http://${seedDomain}`
    }

    try {
      fs.writeFileSync(this.fileName, seedDomain + '\n');
    } catch (err) {
      logger.unexpectedError(`failed to initialize frontier for domain ${seedDomain}`, err);
    }
  }

  readyForReading() {
    return !this.isEmpty() && !this.currentlyReading
  }

  isEmpty() {
    assert(this.urlsInFrontier >= 0);
    return this.urlsInFrontier === 0;
  }

  async getNextUrl() {
    let buffer;
    if (!this.readyForReading()) return ""
    // This is effectively a lock and must occur before the read begins
    // Why the heck do we need locks in a single threaded environment?
    // The answer is because IO happens across multiple threads in Node.
    // Let me describe a scenario
    // 1. suppose getNextUrl is called, and then we wait on readFileAsync
    // This operation happens in an external thread in node and  a callback will
    // eventually be placed on the event loop. This invocation of getNextUrl
    // will be called C1.
    // 2. getNextUrl is called a second time and also waits on readFileAsync.
    // This invocation will be called C2. In this scenario, C1 and C2 are
    // now both reading from the same file.
    // 3. C1 returns from readFileAsync, yielding the last remaining url, and then
    // waits on writeFileAsync
    // 4. C2 returns from readFileAsync with the same url as C1 and also waits
    // on writeFileAsync
    // 5. C1 returns from writeFileAsync, completeing the removal of our url from the frontier.
    // 6. C2 returns from writeFileAsync, effectively leaving the file
    // unchanged (empty) since the allUrls would have been the same in the stack frames of both
    // C1 and C2.
    // END: urlsInFrontier is now set to -1, and we returned and scraped the same URL twice.
    this.currentlyReading = true;
    try {
      this.urlsInFrontier--;
      buffer = await fs.readFileAsync(this.fileName);
    } catch (err) {
      logger.unexpectedError(
        `failed to read from frontier file - getNextUrl ${this.fileName}`,
        err
      );
    }
    const allUrls = buffer.toString().split("\n");
    const nextUrl = allUrls[0];
    // This probably does not need to be awaited because the politness check
    // would stop us from scraping the same domain twice in a short period of time.
    try {
      await fs.writeFileAsync(this.fileName, allUrls.slice(1).join("\n"));
    } catch (err) {
      logger.unexpectedError(`failed to write to frontier file - getNextUrl ${this.fileName}`, err);
    }
    this.currentlyReading = false;
    return nextUrl;
  }

  append(newUrl) {
    this.queuedNewlinks.push(newUrl)
    const oneMinute = 1 * 60 * 1000

    // Often times we find many new links back to back on the same page
    // Queue them all at once
    if (!this.flushScheduled) {
      setTimeout(this.flushNewLinkQueue.bind(this), oneMinute)
      this.flushScheduled = true
    }
  }

  async flushNewLinkQueue() {
    assert(this.flushScheduled)
    const linksToAppend = this.queuedNewlinks.join('\n')
    assert(linksToAppend)

    if (this.currentlyReading) {
      const fiveSeconds = 5 * 1000
      setTimeout(this.flushNewLinkQueue.bind(this), fiveSeconds)
      return
    }
    this.flushScheduled = false

    // Should never be true

    // This flag is not to protect against a race condition but rather
    // so that the crawler can keep tabs on the number of open files
    // to avoid exceeding unix file open limits
    this.currentlyReading = true;
    try {
      await fs.appendFileAsync(this.fileName, `${linksToAppend}\n`);
      this.urlsInFrontier += this.queuedNewlinks.length;
      this.queuedNewlinks = []
    } catch (err) {
      logger.unexpectedError(`failed to append to to frontier file - append ${this.fileName}`, err);
    }
    this.currentlyReading = false;
  }
}

module.exports = Frontier;
