const sinon = require("sinon");
const { expect } = require("chai");
const Domains = require("APP/src/domains/domains");
const Events = require("events");

describe("Domains", () => {
  const storage = {};
  beforeEach(() => {
    storage.writeFileSync = sinon.spy();
    storage.readFileAsync = sinon.spy();
    storage.writeFileAsync = sinon.spy();
    storage.appendFileAsync = sinon.spy();
  });

  describe("getDomainToScrape", () => {
    it("should return the next domain that is polite to scrape and empty string if there are no polite options", () => {
      const eventCoordinator = new Events();
      const seed = ["www.google.com", "www.yahoo.com", "www.bing.com"];
      const domains = new Domains(seed, eventCoordinator, storage);

      expect(domains.getDomainToScrape()).to.equal("www.google.com");
      expect(domains.getDomainToScrape()).to.equal("www.yahoo.com");
      expect(domains.getDomainToScrape()).to.equal("www.bing.com");
    });

    it("should reset to the beginning of the generator when depleted", () => {
      const eventCoordinator = new Events();
      const seed = ["www.google.com"];
      const domains = new Domains(seed, eventCoordinator, storage);

      const clock = sinon.useFakeTimers();
      const twoMinutes = 60 * 2 * 1000;
      clock.tick(twoMinutes); // this is necessary because time starts at 0 in Sinon

      expect(domains.getDomainToScrape()).to.equal("www.google.com");
      clock.tick(twoMinutes);
      expect(domains.getDomainToScrape()).to.equal("www.google.com");

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
      const eventCoordinator = new Events();
      const seed = ["www.google.com", "www.yahoo.com"];
      const domains = new Domains(seed, eventCoordinator, storage);

      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(1);
      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(2);
    });
  });

  describe("getNextUrlToScrape", () => {
    it("returns the urls from the file", async () => {
      const eventCoordinator = new Events();
      const seed = ["www.google.com", "www.yahoo.com"];
      const domains = new Domains(seed, eventCoordinator, storage);
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
      const eventCoordinator = new Events();
      const seed = [];
      const domains = new Domains(seed, eventCoordinator, storage);

      expect(await domains.getNextUrlToScrape()).to.equal("");
    });
  });
});
