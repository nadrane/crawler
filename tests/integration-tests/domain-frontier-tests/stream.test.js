const fs = require("fs");
const Events = require("events");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const { expect } = require("chai");
const makeDomainStream = require("APP/src/domains/");
const makeDomainToUrlStream = require("APP/src/frontiers");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeLogger = require("APP/src/logger/");

describe("domain->frontier streams", () => {
  const eventCoordinator = new Events();
  const logger = makeLogger();

  beforeEach(() => rimraf(`${FRONTIER_DIRECTORY}/*`));
  afterEach(() => rimraf(`${FRONTIER_DIRECTORY}/*`));

  it("outputs a single url given a single input url", () => {
    const seeDomain = ["google.com"];
    const domainStream = makeDomainStream(seeDomain, eventCoordinator, logger, 1);
    const domainToUrlStream = makeDomainToUrlStream(seeDomain, logger, eventCoordinator, fs, 1);
    const urlStream = domainStream.pipe(domainToUrlStream);

    return new Promise((resolve, reject) => {
      urlStream.on("readable", () => {
        console.log("readable");
        const expectedUrl = "http://google.com";
        const url = urlStream.read();
        try {
          expect(url).to.equal(expectedUrl);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
