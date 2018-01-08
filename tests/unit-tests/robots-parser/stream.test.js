const { expect } = require("chai");
const Events = require("events");
const sinon = require("sinon");
const { PassThrough } = require("stream");

const makeRobotsStream = require("APP/src/robots-parser");
const makeLogger = require("APP/src/logger/");

describe.only("robots-parser", () => {
  describe("stream", () => {
    it("returns a response for every inputted url", async () => {
      const fakeLoggerHttp = {
        post: sinon.stub().returns(Promise.resolve())
      };
      const logger = makeLogger(new Events(), fakeLoggerHttp);
      const fakeRobotsHttp = sinon
        .stub()
        .returns(Promise.resolve({ data: "User-agent: *\nDisallow:" }));

      const stream = makeRobotsStream(logger, fakeRobotsHttp, 100);
      const testStream = new TestStream();

      stream.pipe(testStream);
      const urls = require("APP/seed-domains-sans-subs").map(url => "http://" + url);
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
    });
  });
});

class TestStream extends PassThrough {
  constructor(options) {
    super(options);
    this.buffer = [];
  }

  _transform(data, enc, done) {
    this.buffer.push(data);
    done();
  }

  toString() {
    return this.buffer.join("\n");
  }
}
