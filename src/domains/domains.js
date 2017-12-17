const DomainTracker = require("./domain-tracker");

class Domains {
  constructor(seedFile) {
    this.domainTrackers = new Map();
    this.seedDomains(seedFile)
    this.domainGenerator = this._nextDomain();
  }

  seedDomains(seedFile) {
    seedFile.toString()
      .split("\n")
      .map(domain => this.domainTrackers.set(domain, new DomainTracker(domain)))
  }

  countOpenFiles() {
    let filesOpen = 0;
    for (let domainTracker of this.domainTrackers.values()) {
      filesOpen += domainTracker.currentlyReading() ? 1 : 0;
    }
    return filesOpen;
  }

  *_nextDomain() {
    for (let [domain, domainTracker] of this.domainTrackers) {
      if (domainTracker.readyToScrape()) {
        yield domain;
      }
    }
  }

  getDomainToScrape() {
    let domain = this.domainGenerator.next();
    if (domain.done) {
      this.domainGenerator = this._nextDomain();
      domain = this.domainGenerator.next();
    }
    return domain.value;
  }

  async getNextUrlToScrape() {
    const domain = this.getDomainToScrape()
    if (!domain) {
      return ""
    }
    const domainTracker = this.domainTrackers.get(domain)
    return await domainTracker.getNextUrl();
  }
}

module.exports = Domains;
