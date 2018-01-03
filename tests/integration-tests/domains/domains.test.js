const Events = require('events');
const { expect } = require("chai");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const { FRONTIER_DIRECTORY } = require("APP/env/");
const Domains = require("APP/src/domains/domains");

describe("Domains", () => {
  beforeEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  afterEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });

  describe("getNextUrlToScrape", async () => {
    it("returns a sequence of different urls from the seed file", async () => {
      const eventCoordinator = new Events();
      const seed = ["google.com", "youtube.com", "facebook.com"];
      const domains = new Domains(seed, eventCoordinator);

      expect(await domains.getNextUrlToScrape()).to.equal("http://google.com");
      expect(await domains.getNextUrlToScrape()).to.equal("http://youtube.com");
      expect(await domains.getNextUrlToScrape()).to.equal("http://facebook.com");
    });
  });
});
