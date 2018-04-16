const fs = require("fs");
const Events = require("events");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));

const makeDomainStream = require("APP/src/domains/");
const makeDomainToUrlStream = require("APP/src/frontiers");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeLogger = require("APP/src/logger/");

describe("domain->frontier streams", () => {
  const eventCoordinator = new Events();
  const logger = makeLogger(eventCoordinator);

  beforeEach(() => rimraf(`${FRONTIER_DIRECTORY}/*`));
  afterEach(() => rimraf(`${FRONTIER_DIRECTORY}/*`));

  it("outputs a single url given a single input url", () => {
    const seeDomain = ["google.com"];
    const domainStream = makeDomainStream(seeDomain, eventCoordinator, logger, 1);
    const domainToUrlStream = makeDomainToUrlStream(seeDomain, logger, fs, 1);
    const urlStream = domainStream.pipe(domainToUrlStream);

    return new Promise((resolve, reject) => {
      urlStream.on("readable", () => {
        const expectedUrl = "http://google.com\n";
        const url = urlStream.read();
        if (url === expectedUrl) {
          resolve();
        }
        reject(new Error(`incorrect url returned. Expected ${url} to equal ${expectedUrl}`));
      });
    });
  });
});
