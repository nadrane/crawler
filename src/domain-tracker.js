const Frontier = require("./frontier");

class DomainTracker {
  constructor(domain) {
    this.domain = domain;
    this.frontier = new Frontier(domain);
    this.lastScraped = 0; // A really early time so it will definitely be scrapped.
  }

  readyToScrape() {
    return this.politeToScrape() && !this.frontier.isEmpty()
  }

  politeToScrape() {
    return this.lastScraped + 120 * 1000 < Date.now();
  }

  updateTimeLastScraped() {
    return (this.lastScraped = Date.now());
  }
}

module.exports = DomainTracker;
