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
    expect(http.post.calledWithExactly(fakeUrl, logs.join(""))).to.be.true;
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
      expect(http.post.calledWithExactly(fakeUrl, logs.join(""))).to.be.true;
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
      expect(http.post.firstCall.calledWithExactly(fakeUrl, ["log1", "log2", "log3"].join(""))).to
        .be.true;
      expect(http.post.secondCall.calledWithExactly(fakeUrl, ["log4", "log5", "log6"].join(""))).to
        .be.true;
      expect(http.post.thirdCall.calledWithExactly(fakeUrl, ["log7", "log8"].join(""))).to.be.true;
      done();
    });
  });

  it("will flush the buffer to the server after one minute", () => {
    const clock = sinon.useFakeTimers();
    const http = { post: sinon.stub().returns(Promise.resolve()) };
    const fakeUrl = "fakeUrl4";
    const logger = new LogStream(fakeUrl, http, 3);

    logger.write("log1");
    logger.write("log2");
    clock.tick(59999);
    expect(http.post.called).to.be.false;
    clock.tick(1);
    expect(http.post.calledOnce).to.be.true;
    expect(http.post.calledWithExactly(fakeUrl, ["log1", "log2"].join(""))).to.be.true;

    clock.restore();
  });
});
