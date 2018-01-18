const sinon = require("sinon");
const { expect } = require("chai");
const DomainTracker = require("APP/src/domains/domain-tracker");
const { DOMAIN_REQUEST_TIME_INTERVAL } = require("APP/env");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

describe("Domain Tracker", () => {
  const storage = {};
  const eventCoordinator = new Events();
  const logger = makeLogger(eventCoordinator);

  beforeEach(() => {
    storage.writeFileSync = sinon.spy();
    storage.readFileAsync = sinon.spy();
    storage.writeFileAsync = sinon.spy();
    storage.appendFileAsync = sinon.spy();
    storage.existsSync = () => false;
  });

  describe("currentlyReading", () => {
    it("starts in non-reading mode", () => {
      const domainTracker = new DomainTracker("www.google.com", logger, storage);
      expect(domainTracker.currentlyReading()).to.be.false;
    });
  });

  describe("politeToScrape", () => {
    it("should be polite to scrape upon creation", () => {
      const domainTracker = new DomainTracker("www.google.com", logger, storage);
      expect(domainTracker.politeToScrape()).to.be.true;
    });

    it("should not be polite to scrape twice within the DOMAIN_REQUEST_TIME_INTERVAL window", () => {
      const domainTracker = new DomainTracker("www.google.com\nwww.google.com/search", logger, storage);

      expect(domainTracker.politeToScrape()).to.be.true;
      domainTracker.updateTimeLastScraped();
      expect(domainTracker.politeToScrape()).to.be.false;
    });

    it("should be polite to scrape again once DOMAIN_REQUEST_TIME_INTERVAL expires", () => {
      const domainTracker = new DomainTracker("www.google.com\nwww.google.com/search", logger, storage);
      const clock = sinon.useFakeTimers();

      domainTracker.updateTimeLastScraped();
      clock.tick(DOMAIN_REQUEST_TIME_INTERVAL - 1);
      expect(domainTracker.politeToScrape()).to.be.false;
      clock.tick(1);
      expect(domainTracker.politeToScrape()).to.be.true;

      clock.restore();
    });
  });

  describe("readyToScrape", () => {
    it("should be ready for scraping when the domain tracker is created", () => {
      const domainTracker = new DomainTracker("www.google.com", logger, storage);
      expect(domainTracker.readyToScrape()).to.be.true;
    });

    it("should not be ready for scraping if the frontier is empty", () => {
      const domainTracker = new DomainTracker("www.google.com", logger, storage);
      domainTracker._frontier.uncrawledUrlsInFrontier = 0;

      expect(domainTracker.readyToScrape()).to.be.false;
    });
  });
});
