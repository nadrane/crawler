const Events = require("events");
const fs = require("fs");

const { expect } = require("chai");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const { FRONTIER_DIRECTORY } = require("APP/env/");
const Domains = require("APP/src/domains/domains");
const makeLogger = require("APP/src/logger/");

describe("Domains", () => {
  const eventCoordinator = new Events();
  const logger = makeLogger(eventCoordinator);

  beforeEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  afterEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });

  describe("getNextUrlToScrape", async () => {
    it("returns a sequence of different urls", async () => {
      const seed = ["google.com", "youtube.com", "facebook.com"];
      const domains = new Domains(seed, eventCoordinator, fs, logger);

      expect(await domains.getNextUrlToScrape()).to.equal("http://google.com");
      expect(await domains.getNextUrlToScrape()).to.equal("http://youtube.com");
      expect(await domains.getNextUrlToScrape()).to.equal("http://facebook.com");
    });
  });
});
