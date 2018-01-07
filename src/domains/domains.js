const DomainTracker = require("./domain-tracker");
const { getDomain } = require("tldjs");

class Domains {
  constructor(seedData, eventCoordinator, storage, logger) {
    this.domainTrackers = new Map();
    this.storage = storage;
    this.seedDomains(seedData, logger);
    this.domainGenerator = this._nextDomain();
    eventCoordinator.on("new link", ({ fromUrl, newUrl }) => {
      this.appendNewUrl(newUrl);
      logger.addingToFrontier(fromUrl, newUrl);
    });
  }

  seedDomains(seedData, logger) {
    seedData.forEach(domain => {
      const domainWithoutSubdomains = getDomain(domain);
      if (!domainWithoutSubdomains) return;
      this.domainTrackers.set(
        domainWithoutSubdomains,
        new DomainTracker(domainWithoutSubdomains, logger, this.storage)
      );
    });
  }

  appendNewUrl(url) {
    const domain = getDomain(url);
    const domainTracker = this.domainTrackers.get(domain);
    // Only track a specific subset of domains on each server.
    // If a link is found to an unseeded domain, ignore it
    if (!domainTracker) return;

    domainTracker.appendNewUrl(url);
  }

  countOpenFiles() {
    let filesOpen = 0;
    for (const domainTracker of this.domainTrackers.values()) {
      filesOpen += domainTracker.currentlyReading() ? 1 : 0;
    }
    return filesOpen;
  }

  *_nextDomain() {
    for (const [domain, domainTracker] of this.domainTrackers) {
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

  getNextUrlToScrape() {
    const domain = this.getDomainToScrape();
    if (!domain) {
      return Promise.resolve("");
    }
    const domainTracker = this.domainTrackers.get(domain);
    return domainTracker.getNextUrl();
  }
}

module.exports = Domains;
