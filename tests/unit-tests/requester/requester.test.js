const sinon = require("sinon");
const { expect } = require("chai");
const makeRequester = require("APP/src/requester/requester");
const makeLogger = require("APP/src/logger/");
const Events = require("events");
const streamify = require("string-to-stream");
const TestStream = require("../../testStream");

describe("requester", () => {
  describe("crawlWithGETRequest", () => {
    it("returns a stream of html given a url", async () => {
      const logger = makeLogger(new Events());
      sinon.stub(logger);
      const http = sinon
        .stub()
        .returns(Promise.resolve({ data: streamify("<html><head></head><body>nick</body></html>") }));
      const testStream = new TestStream();
      const crawlWithGETRequest = makeRequester(logger, http);

      const response = await crawlWithGETRequest("http://google.com");
      response.pipe(testStream);
      return new Promise(resolve => {
        response.on("end", () => {
          expect(testStream.toString()).to.equal("<html><head></head><body>nick</body></html>");
          resolve();
        });
      });
    });
    it("returns null if there is an error", async () => {
      const logger = makeLogger(new Events());
      sinon.stub(logger);
      const requestError = new Error("Failed to make request");
      requestError.request = {};
      const http = sinon.stub().returns(Promise.reject(requestError));
      const crawlWithGETRequest = makeRequester(logger, http);

      const response = await crawlWithGETRequest("http://google.com");
      expect(response).to.be.null;
    });
  });
});
