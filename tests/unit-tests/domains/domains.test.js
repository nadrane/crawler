const fs = require("fs");
const sinon = require("sinon");
const mocha = require("mocha");
const { expect } = require("chai");
const domainFactory = require("APP/src/domains/domains");

const sandbox = sinon.createSandbox();

describe("Domains", () => {
  let domainsPromise;
  let domains;
  beforeEach(() => {
    sandbox.stub(fs, "writeFileSync");
    sandbox.stub(fs, "writeFileAsync");
    sandbox.stub(fs, "readFileAsync").returns(Promise.resolve("www.google.com"));
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe("getDomainToScrape", () => {
    it("should return the next domain that is polite to scrape and empty string if there are no polite options", async () => {
      const domainsPromise = Promise.resolve(Buffer.from("www.google.com\nwww.yahoo.com\nwww.bing.com"));
      const domains = await domainFactory(domainsPromise);

      expect(domains.getDomainToScrape()).to.equal("www.google.com");
      expect(domains.getDomainToScrape()).to.equal("www.yahoo.com");
      expect(domains.getDomainToScrape()).to.equal("www.bing.com");
    });

    it("should reset to the beginning of the generator when depleted", async () => {
      const domainsPromise = Promise.resolve(Buffer.from("www.google.com"));
      const domains = await domainFactory(domainsPromise);
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
    it("should return zero when no files are being read", async () => {
      const domainsPromise = Promise.resolve(Buffer.from("www.google.com"));
      const domains = await domainFactory(domainsPromise);

      expect(domains.countOpenFiles()).to.equal(0);
    });

    it("should correctly count the number of open files", async () => {
      const domainsPromise = Promise.resolve(Buffer.from("www.google.com\nwww.yahoo.com"));
      const domains = await domainFactory(domainsPromise);

      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(1);
      domains.getNextUrlToScrape();
      expect(domains.countOpenFiles()).to.equal(2);
    });
  });

  describe("getNextUrlToScrape", () => {
    it("returns the urls from the file", async () => {
      const domainsPromise = Promise.resolve(Buffer.from("www.google.com\nwww.yahoo.com"));
      const domains = await domainFactory(domainsPromise);

      expect(await domains.getNextUrlToScrape()).to.equal("www.google.com");
    });
  });
});
