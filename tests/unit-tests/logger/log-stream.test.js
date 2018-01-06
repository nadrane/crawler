const sinon = require("sinon");
const { expect } = require("chai");
const LogStream = require("APP/src/logger/bunyan-adaptor/log-stream");

describe("Logger", () => {
  it("should post the logs to the provided url", () => {
    const http = { post: sinon.stub().returns(Promise.resolve()) };
    const fakeUrl = "fakeUrl";
    const logger = new LogStream(fakeUrl, http, 5);
    const logs = ["log1", "log2", "log3", "log4", "log5"];

    for (const url of logs) {
      logger.write(url);
    }
    logger.end();
    expect(http.post.calledWithExactly(fakeUrl, logs.join("\n"))).to.be.true;
  });
  it("posts to the url when the buffer is partially full on stream end ", done => {
    const http = { post: sinon.stub().returns(Promise.resolve()) };
    const fakeUrl = "fakeUrl2";
    const logger = new LogStream(fakeUrl, http, 5);
    const logs = ["log1", "log2", "log3"];

    for (const url of logs) {
      logger.write(url);
    }
    logger.end();
    logger.on("finish", () => {
      expect(http.post.calledWithExactly(fakeUrl, logs.join("\n"))).to.be.true;
      done();
    });
  });
  it("posts with a buffer reset in between", done => {
    const http = { post: sinon.stub().returns(Promise.resolve()) };
    const fakeUrl = "fakeUrl3";
    const logger = new LogStream(fakeUrl, http, 3);
    const logs = ["log1", "log2", "log3", "log4", "log5", "log6", "log7"];

    for (const url of logs) {
      logger.write(url);
    }
    logger.end("log8");
    logger.on("finish", () => {
      expect(http.post.firstCall.calledWithExactly(fakeUrl, ["log1", "log2", "log3"].join("\n"))).to.be.true;
      expect(http.post.secondCall.calledWithExactly(fakeUrl, ["log4", "log5", "log6"].join("\n"))).to.be.true;
      expect(http.post.thirdCall.calledWithExactly(fakeUrl, ["log7", "log8"].join("\n"))).to.be.true;
      done();
    });
  });
});
