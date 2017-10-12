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