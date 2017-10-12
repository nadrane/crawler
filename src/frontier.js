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

const logger = require('./logger')

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

class Frontier {
  constructor(urls) {
    this.frontier = [];
    this.frontier.push(...urls);
    this.frontierPointer = 0;
  }

    // return bluebird.map(domainWhitelist.entries(), domain => fs.appendFileAsync('../frontier.txt', url + '\n'))
  reset() {
    this.frontierPointer = 0;
  }

  isAtEnd() {
    return this.frontierPointer === this.frontier.length;
  }

  isEmpty() {
    this.frontier.length === 0;
  }

  getNextUrl() {
    const url = this.peekNextUrl();
    this.frontier.slice(this.frontierPointer, 1);
    this.frontierPointer++;
    return url;
  }

  skipToNextUrl() {
    this.frontierPointer++;
  }

  peekNextUrl() {
    return this.frontier[this.frontierPointer];
  }

  append(newUrl) {
    this.frontier.push(newUrl);
  }
}

module.exports =  Frontier;