const axios = require("axios");
const { expect } = require("chai");
const Events = require("events");
const sinon = require("sinon");
const streamify = require('stream-array');
const TestStream = require("../../testStream");

const sourceUrls = require("APP/seed-domains-sans-subs");
const makeRobotsStream = require("APP/src/robots-parser");
const makeLogger = require("APP/src/logger/");

describe.skip("robots-parser", () => {
  describe("stream", () => {
    it("returns responses", async () => {
      const logger = makeLogger(new Events());
      logger.unexpectedError = sinon.stub().returns(new Error("unexpected error!"));

      const sourceStream = streamify(sourceUrls.map(url => `http://${url}`));

      const robotsStream = makeRobotsStream(logger, axios, 100);
      const testStream = new TestStream();

      sourceStream.pipe(robotsStream).pipe(testStream);

      const endPromise = new Promise(resolve => {
        robotsStream.on("end", () => {
          resolve();
          expect(testStream.buffer).to.have.lengthOf(sourceUrls.length);
        });
      });
      return endPromise;
    }).timeout(60 * 1000 * 10);
  });
});