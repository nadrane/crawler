const { getDomain } = require("tldjs");
const mkdirp = require("mkdirp");
const path = require("path");
const serializeError = require("serialize-error");

class Logger {
  constructor(eventCoordinator, outputFile, logAdaptor) {
    mkdirp.sync(path.dirname(outputFile));
    this.logger = logAdaptor(outputFile);
    this.lastFiveUnexpected = [];
    this.eventCoordinator = eventCoordinator;
  }

  trackUnexpectedErrors() {
    this.lastFiveUnexpected.unshift(new Date());
    if (this.lastFiveUnexpected.length >= 5) {
      const timeElapsed =
        this.lastFiveUnexpected[0] - this.lastFiveUnexpected[this.lastFiveUnexpected.length - 1];
      if (timeElapsed < 1000) {
        this.eventCoordinator.emit("stop");
      }
      this.lastFiveUnexpected.pop();
    }
  }

  unexpectedError(err, event, data) {
    const jsonError = serializeError(err);
    this.logger.error({ err: jsonError, event, data });
    this.trackUnexpectedErrors();
  }

  parserError(url, err) {
    this.logger.error({ event: "parser error", err, url });
  }

  robotsRequestTimeout(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "robots request timeout",
      url,
      domain
    });
  }

  noRobotsResponseReceived(module, err, url) {
    const domain = getDomain(url);
    this.logger.info({
      module,
      event: "no robots response received",
      url,
      domain
    });
  }

  robotsCacheHit(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "robotstxt cache hit",
      url,
      domain
    });
  }

  robotsCacheMiss(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "robotstxt cache miss",
      url,
      domain
    });
  }

  GETResponseError(url, err, status, headers) {
    const domain = getDomain(url);
    this.logger.info({
      event: "response error",
      status,
      headers,
      err: err.message,
      url,
      domain
    });
  }

  noGETResponseRecieved(err, url) {
    const domain = getDomain(url);
    this.logger.info({
      err,
      event: "no get response received",
      url,
      domain
    });
  }

  connectionReset(url) {
    const domain = getDomain(url);
    this.logger.info({ event: "connection reset", url, domain });
  }

  addingToFrontier(fromUrl, newUrl) {
    const newDomain = getDomain(newUrl);
    const fromDomain = getDomain(fromUrl);
    this.logger.info({
      event: "new link",
      fromUrl,
      fromDomain,
      newUrl,
      newDomain,
      domain: fromDomain // stats server needs the domain fields
    });
  }

  robotsRequestSent(url) {
    const domain = getDomain(url);
    this.logger.info({ event: "robots request sent", url, domain });
  }

  GETRequestSent(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "request sent",
      url,
      domain
    });
  }

  GETResponseReceived(url, statusCode) {
    const domain = getDomain(url);
    this.logger.info({
      event: "response success",
      statusCode,
      url,
      domain
    });
  }

  GETRequestTimeout(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "response timeout",
      url,
      domain
    });
  }

  s3UploadStarted(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "s3 upload started",
      domain
    });
  }

  s3UploadFinished(url) {
    const domain = getDomain(url);
    this.logger.info({
      event: "s3 upload finished",
      domain
    });
  }

  spawningWorkerProcess(processId) {
    this.logger.info({
      event: "spawning worker process",
      processId
    });
  }

  robotsEntered() {
    this.logger.debug({
      event: "robotsEntered"
    });
  }
  robotsLeft() {
    this.logger.debug({
      event: "robotsLeft"
    });
  }
  setEntered() {
    this.logger.debug({
      event: "setEntered"
    });
  }
  setLeft() {
    this.logger.debug({
      event: "setleft"
    });
  }
  checkEntered() {
    this.logger.debug({
      event: "checkEntered"
    });
  }
  checkLeft() {
    this.logger.debug({
      event: "checkLeft"
    });
  }
  requesterEntered() {
    this.logger.debug({
      event: "requesterEntered"
    });
  }
  requesterLeft() {
    this.logger.debug({
      event: "requesterLeft"
    });
  }
}

module.exports = Logger;
