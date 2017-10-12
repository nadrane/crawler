const Frontier = require("./frontier");

class DomainTracker {
  constructor(domain) {
    this.domainName = domain;
    this.frontier = new Frontier(domain);
    this.lastScraped = 0; // A really early time so it will definitely be scrapped.
  }

  politeToScrape() {
    return this.lastScraped + 120 * 1000 < Date.now();
  }

  updateTimeLastScraped() {
    return (this.lastScraped = Date.now());
  }
}

module.exports = DomainTracker;
