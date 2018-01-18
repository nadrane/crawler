const sinon = require("sinon");
const { expect } = require("chai");
const Domains = require("APP/src/domains/domains");
const Events = require("events");
const makeLogger = require("APP/src/logger/");

describe("Domains", () => {
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

  describe("constructor", () => {
    it("should register a 'new link' event handler that appends urls to the appropriate frontier", async () => {
      const seed = ["google.com", "yahoo.com", "bing.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);
      // I know it's bad practice (law of demeter) to reach through object graphs like this...
      // but maybe it's okay for testing purposes??
      const frontier = domains.domainTrackers.get("google.com")._frontier;

      expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
      eventCoordinator.emit("new link", { newUrl: "google.com/search", fromUrl: "google.com" });
      await frontier.flushNewLinkQueue();
      expect(frontier.uncrawledUrlsInFrontier).to.equal(2);
    });

    it("should parse out any subdomains when creating domain tracker objects", () => {
      const seed = ["www.google.com", "stock.finance.yahoo.com", "bing.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);

      expect(domains.domainTrackers.has("google.com")).to.be.true;
      expect(domains.domainTrackers.has("yahoo.com")).to.be.true;
      expect(domains.domainTrackers.has("bing.com")).to.be.true;
      expect(domains.domainTrackers.has("www.google.com")).to.be.false;
      expect(domains.domainTrackers.has("stock.finance.yahoo.com")).to.be.false;
      expect(domains.domainTrackers.has("finance.yahoo.com")).to.be.false;
    });

    it("successfully loads a large seed file", () => {
      const seed = require("APP/seed").slice(0, 5000);
      const domains = new Domains(seed, eventCoordinator, storage, logger);

      const { domainTrackers } = domains;
      expect(domainTrackers.has("google.com")).to.be.true;
      expect(domainTrackers.has("tokopedia.com")).to.be.true;
    });
  });

  describe("getDomainToScrape", () => {
    it("should return the next domain that is polite to scrape and empty string if there are no polite options", () => {
      const seed = ["www.google.com", "www.yahoo.com", "www.bing.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);

      expect(domains.getDomainToScrape()).to.equal("google.com");
      expect(domains.getDomainToScrape()).to.equal("yahoo.com");
      expect(domains.getDomainToScrape()).to.equal("bing.com");
    });

    it("should reset to the beginning of the generator when depleted", () => {
      const seed = ["www.google.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);

      const clock = sinon.useFakeTimers();
      const twoMinutes = 60 * 2 * 1000;
      clock.tick(twoMinutes); // this is necessary because time starts at 0 in Sinon

      expect(domains.getDomainToScrape()).to.equal("google.com");
      clock.tick(twoMinutes);
      expect(domains.getDomainToScrape()).to.equal("google.com");

      clock.restore();
    });
  });

  describe("countOpenFiles", () => {
    it("should return zero when no files are being read", () => {
      const eventCoordinator = new Events();
      const seed = ["www.google.com"];
      const domains = new Domains(seed, eventCoordinator, storage);

      expect(domains.countOpenFiles()).to.equal(0);
    });

    it("should correctly count the number of open files", () => {
      const seed = ["www.google.com", "www.yahoo.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);
      storage.readFileAsync = sinon.stub().returns("");

      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(1);
      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(2);
    });
  });

  describe("getNextUrlToScrape", () => {
    it("returns the urls from the file", async () => {
      const seed = ["www.google.com", "www.yahoo.com"];
      const domains = new Domains(seed, eventCoordinator, storage, logger);
      storage.readFileAsync = sinon
        .stub()
        .onFirstCall()
        .returns("www.google.com")
        .onSecondCall()
        .returns("www.yahoo.com");

      expect(await domains.getNextUrlToScrape()).to.equal("www.google.com");
      expect(await domains.getNextUrlToScrape()).to.equal("www.yahoo.com");
    });

    it("returns a promise that resolve to '' when there are no domains to scrape", async () => {
      const seed = [];
      const domains = new Domains(seed, eventCoordinator, storage, logger);

      expect(await domains.getNextUrlToScrape()).to.equal("");
    });
  });
});
