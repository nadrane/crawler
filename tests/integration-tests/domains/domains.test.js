const { expect } = require("chai");
const Domains = require("APP/src/domains/domains");
const makeLogger = require("APP/src/logger/");

describe("Domains", () => {
  const logger = makeLogger();

  describe("getNextUrlToScrape", async () => {
    it("returns a sequence of different urls", async () => {
      const seed = ["google.com", "youtube.com", "facebook.com"];
      const domains = new Domains(seed, logger);

      expect(await domains.getNextDomainToScrape()).to.equal("google.com");
      expect(await domains.getNextDomainToScrape()).to.equal("youtube.com");
      expect(await domains.getNextDomainToScrape()).to.equal("facebook.com");
    });
  });
});
