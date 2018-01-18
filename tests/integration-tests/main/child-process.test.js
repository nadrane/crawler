const runCrawler = require("APP/src/main/child-process");
const seed = require("APP/seed");
const sinon = require("sinon");
const Events = require("events");
const makeLogger = require("APP/src/logger/");
const makeBloomFilterClient = require("APP/src/bloom-filter/client/");

describe("Crawler works with a concurrency of 1", () => {
  it.skip("runs", () => {
    const eventCoorindator = new Events();
    const http = sinon.stub().returns(Promise.resolve());
    const logger = makeLogger(eventCoorindator, http);
    const loggerStub = sinon.stub(logger);

    const bloomFilterClient = makeBloomFilterClient(logger);
    bloomFilterClient.check = sinon.stub().returns(Promise.resolve());
    bloomFilterClient.set = sinon.stub().returns(Promise.resolve());

    runCrawler(seed, logger, http, bloomFilterClient, 1);

    console.log("ending process");
  });
});
