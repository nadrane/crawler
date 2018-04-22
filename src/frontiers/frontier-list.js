const fs = require("fs");
const { getDomain } = require("tldjs");
const Frontier = require("./frontier");

class FrontierList {
  constructor(seedDomains, logger, eventCoordinator, storage = fs) {
    this.frontiers = {};
    this._seedFrontiers(seedDomains, logger, storage);

    eventCoordinator.on("new link", ({ fromUrl, newUrl }) => {
      const domain = getDomain(newUrl);
      const frontier = this.frontiers[domain];

      if (newUrl.startsWith("http://quotes")) return;

      // Whitelist urls to only existing domains
      if (frontier) {
        logger.frontiers.appendingUrl(fromUrl, newUrl);
        frontier.append(newUrl);
      }
    });
  }

  _seedFrontiers(seedDomains, logger, storage) {
    seedDomains.forEach(domain => {
      const domainWithoutSubdomains = getDomain(domain);
      if (!domainWithoutSubdomains) return;

      this.frontiers[domainWithoutSubdomains] = new Frontier(
        domainWithoutSubdomains,
        logger,
        storage
      );
    });
  }

  allFrontiersEmpty() {
    return Object.values(this.frontiers).every(frontier => frontier.isEmpty());
  }

  getNextUrlForDomain(domain) {
    const frontier = this.frontiers[domain];
    return frontier.getNextUrl();
  }
}

module.exports = FrontierList;
