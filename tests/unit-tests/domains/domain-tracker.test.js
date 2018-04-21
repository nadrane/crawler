const sinon = require("sinon");
const { expect } = require("chai");
const DomainTracker = require("APP/src/domains/domain-tracker");
const { DOMAIN_REQUEST_TIME_INTERVAL } = require("APP/env");

describe("Domain Tracker", () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  describe.only("politeToScrape", () => {
    it("should be polite to scrape upon creation", () => {
      const domainTracker = new DomainTracker("google.com");
      expect(domainTracker.politeToScrape()).to.be.true;
    });

    it("should not be polite to scrape twice within the DOMAIN_REQUEST_TIME_INTERVAL window", () => {
      const domainTracker = new DomainTracker("google.com");
      expect(domainTracker.politeToScrape()).to.be.true;
      const { domain } = domainTracker;

      expect(domainTracker.politeToScrape()).to.be.false;
    });

    it("should be polite to scrape again once DOMAIN_REQUEST_TIME_INTERVAL expires", () => {
      const domainTracker = new DomainTracker("www.google.com");

      domainTracker._updateTimeLastScraped();
      clock.tick(DOMAIN_REQUEST_TIME_INTERVAL - 1);
      expect(domainTracker.politeToScrape()).to.be.false;
      clock.tick(1);
      expect(domainTracker.politeToScrape()).to.be.true;
    });
  });
});
