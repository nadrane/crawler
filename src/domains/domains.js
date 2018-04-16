const DomainTracker = require("./domain-tracker");
const { getDomain } = require("tldjs");

class Domains {
  constructor(seedData, logger) {
    this.domainTrackers = [];
    this.logger = logger;
    this.seedDomains(seedData);
    // eventCoordinator.on("new link", ({ fromUrl, newUrl }) => {
    //   this.appendNewUrl(newUrl);
    //   logger.domains.addingToFrontier(fromUrl, newUrl);
    // });
  }

  seedDomains(seedData) {
    seedData.forEach(domain => {
      const domainWithoutSubdomains = getDomain(domain);
      if (!domainWithoutSubdomains) return;

      this.domainTrackers.push(new DomainTracker(domainWithoutSubdomains));
    });
  }

  domainsAvailable() {
    return this.domainTrackers[0].politeToScrape();
  }

  getNextDomainToScrape() {
    const domainTracker = this.domainTrackers[0];
    if (!domainTracker.politeToScrape()) {
      this.logger.domains.noReadyDomains();
      return null;
    }

    this.domainTrackers.push(this.domainTrackers.shift());

    const nextDomain = domainTracker.domain;
    this.logger.domains.domainFetched(nextDomain);
    return nextDomain;
  }
}

module.exports = Domains;
