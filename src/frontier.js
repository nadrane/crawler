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
const { writeFileSync } = require("fs");
const { appendFileAsync, readFileAsync, writeFileAsync } = bluebird.promisifyAll(require("fs"));
const logger = require("./logger");
const { join } = require("path");

class Frontier {
  constructor(seedDomain) {
    this.domain = seedDomain;
    this.urlsInFrontier = 1
    this.fileName = join(__dirname, "..", "frontiers", `${seedDomain}.txt`);
    try {
      writeFileSync(this.fileName, `http://${seedDomain}\n`);
    } catch (err) {
      logger.unexpectedError(`failed to initialize frontier for domain ${seedUrl}`, err);
    }
    this.frontierPointer = 0;
  }

  isEmpty() {
    return this.urlsInFrontier === 0;
  }

  async getNextUrl() {
    let buffer;
    if (this.isEmpty()) return ""

    try {
      buffer = await readFileAsync(this.fileName);
      this.urlsInFrontier--;
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
      await writeFileAsync(this.fileName, allUrls.slice(1).join("\n"));
    } catch (err) {
      logger.unexpectedError(`failed to write to frontier file - getNextUrl ${this.fileName}`, err);
    }
    return nextUrl;
  }

  async append(newUrl) {
    // Best to just never allow disallowed URLs to enter the frontier in the first place
    try {
      await appendFileAsync(this.fileName, `${newUrl}\n`);
      this.urlsInFrontier++;
    } catch (err) {
      logger.unexpectedError(`failed to append to to frontier file - append ${this.fileName}`, err);
    }
  }
}

module.exports = Frontier;
