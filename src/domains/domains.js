const DomainTracker = require("./domain-tracker");

class Domains {
  constructor() {
    this.domainTrackers = new Map();
    this.domainGenerator = this._nextDomain();
  }

  seedDomains(domainsPromise) {
    return domainsPromise
      .then(file => file.toString().split("\n"))
      .then(lines =>
        lines.map(domain => this.domainTrackers.set(domain, new DomainTracker(domain)))
      )
      .then(() => this);
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

function domainsFactory(domainsPromise) {
  let promiseForDomains;
  if (!promiseForDomains) {
    const domains = new Domains();
    promiseForDomains = domains.seedDomains(domainsPromise);
  }
  return promiseForDomains;
}

module.exports = domainsFactory;
