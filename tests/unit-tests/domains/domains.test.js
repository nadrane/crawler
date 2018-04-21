const sinon = require("sinon");
const { expect } = require("chai");
const Domains = require("APP/src/domains/domains");
const makeLogger = require("APP/src/logger/");
const { DOMAIN_REQUEST_TIME_INTERVAL } = require("APP/env");

describe("Domains", () => {
  const logger = makeLogger();

  describe("constructor", () => {
    // it("should register a 'new link' event handler that appends urls to the appropriate frontier", async () => {
    //   const seed = ["google.com", "yahoo.com", "bing.com"];
    //   const domains = new Domains(seed, logger);
    //   // I know it's bad practice (law of demeter) to reach through object graphs like this...
    //   // but maybe it's okay for testing purposes??
    //   const frontier = domains.domainTrackers.get("google.com")._frontier;

    //   expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
    //   eventCoordinator.emit("new link", { newUrl: "google.com/search", fromUrl: "google.com" });
    //   await frontier.flushNewLinkQueue();
    //   expect(frontier.uncrawledUrlsInFrontier).to.equal(2);
    // // });

    it("should parse out any subdomains when creating domain tracker objects", () => {
      const seed = ["www.google.com", "stock.finance.yahoo.com", "bing.com"];
      const domains = new Domains(seed, logger);
      const { domainTrackers } = domains;

      expect(domainTrackers.find(tracker => tracker.domain === "google.com")).to.not.be.undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "yahoo.com")).to.not.be.undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "bing.com")).to.not.be.undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "www.google.com")).to.be.undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "stock.finance.yahoo.com")).to.be
        .undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "finance.yahoo.com")).to.be
        .undefined;
    });

    it("successfully loads a large seed file", () => {
      const seed = require("APP/seed").slice(0, 5000);
      const domains = new Domains(seed, logger);
      const { domainTrackers } = domains;

      expect(domainTrackers.find(tracker => tracker.domain === "google.com")).to.not.be.undefined;
      expect(domainTrackers.find(tracker => tracker.domain === "tokopedia.com")).to.not.be
        .undefined;
    });
  });

  describe("getNextDomainToScrape", () => {
    it("should return the next domain that is polite to scrape", () => {
      const seed = ["www.google.com", "www.yahoo.com", "www.bing.com"];
      const domains = new Domains(seed, logger);

      expect(domains.getNextDomainToScrape()).to.equal("google.com");
      expect(domains.getNextDomainToScrape()).to.equal("yahoo.com");
      expect(domains.getNextDomainToScrape()).to.equal("bing.com");
    });

    it("should return null if there are no polite options", () => {
      const seed = ["www.google.com"];
      const domains = new Domains(seed, logger);

      domains.getNextDomainToScrape();
      expect(domains.getNextDomainToScrape()).to.be.null;
    });

    it("should reset to the beginning after visiting every domain", () => {
      const seed = ["www.google.com"];
      const domains = new Domains(seed, logger);

      const clock = sinon.useFakeTimers();
      clock.tick(DOMAIN_REQUEST_TIME_INTERVAL); // this is necessary because time starts at 0 in Sinon

      expect(domains.getNextDomainToScrape()).to.equal("google.com");
      clock.tick(DOMAIN_REQUEST_TIME_INTERVAL);
      expect(domains.getNextDomainToScrape()).to.equal("google.com");

      clock.restore();
    });
  });
});
