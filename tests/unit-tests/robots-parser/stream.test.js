const { expect } = require("chai");
const sinon = require("sinon");
const TestStream = require("../../testStream");

const makeRobotsStream = require("APP/src/robots-parser");
const makeLogger = require("APP/src/logger/");

describe("robots-parser", () => {
  describe("stream", () => {
    it("returns a response for every inputted url", async () => {
      const logger = makeLogger();
      const fakeRobotsHttp = sinon
        .stub()
        .returns(Promise.resolve({ data: "User-agent: *\nDisallow:" }));

      const stream = makeRobotsStream(logger, fakeRobotsHttp, 100);
      const testStream = new TestStream();

      stream.pipe(testStream);
      const urls = require("APP/seed")
        .slice(0, 10000)
        .map(url => `http://${url}`);
      for (const url of urls) {
        stream.write(url);
      }
      stream.end();

      const endPromise = new Promise(resolve => {
        stream.on("end", () => {
          resolve();
          expect(testStream.buffer).to.have.lengthOf(urls.length);
        });
      });
      return endPromise;
    }).timeout(2500);
  });
});
