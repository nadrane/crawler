const { URL } = require("url");
const { parse } = require("tldjs");
const mkdirp = require("mkdirp");
const path = require("path");

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

  initializationLog(maxConnectionsOpen, maxOpenFiles) {
    this.logger.info({ event: "crawler initialization", maxConnectionsOpen, maxOpenFiles });
  }

  unexpectedError(err, event, data) {
    this.logger.error({ err, event, data });
    this.trackUnexpectedErrors();
  }

  parserError(url, err) {
    this.logger.error({ event: "parser error", err, url });
  }

  noRobotsResponseReceived(module, err, url) {
    const domain = parse(url);
    this.logger.info({
      module,
      event: "no robots response received",
      url,
      domain
    });
  }

  GETResponseError(url, err, status, headers) {
    const domain = parse(url);
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
    const domain = parse(url);
    this.logger.info({
      err,
      event: "no get response received",
      url,
      domain
    });
  }

  connectionReset(url) {
    const domain = parse(url);
    this.logger.info({ event: "connection reset", url, domain });
  }

  domainExhausted(domain) {
    this.logger.info({ event: "domain exhausted", domain });
  }

  addingToFrontier(fromUrl, newUrl) {
    const newDomain = parse(newUrl).domain;
    const fromDomain = parse(fromUrl).domain;
    this.logger.info({
      event: "new link",
      fromUrl,
      fromDomain,
      newUrl,
      newDomain
    });
  }
  robotsRequestSent(url) {
    const { hostname } = new URL(url);
    this.logger.info({ event: "robots request sent", url, hostname });
  }
  GETRequestSent(url, totalRequestsMade) {
    const { domain } = parse(url);
    this.logger.info({
      event: "request sent",
      url,
      domain,
      totalRequestsMade
    });
  }

  GETResponseReceived(url, statusCode) {
    const { domain } = parse(url);
    this.logger.info({
      event: "response success",
      statusCode,
      url,
      domain
    });
  }

  connectionMade(url) {
    const { domain } = parse(url);
    this.logger.info({ event: "new connection", url, domain });
  }

  finalizingCrawl(url, totalResponsesParsed) {
    const { domain } = parse(url);
    this.logger.info({
      event: "finalized crawl",
      url,
      domain,
      totalResponsesParsed
    });
  }

  spawningWorkerProcess(processId) {
    this.logger.info({
      event: "spawning worker process", processId,
    });
  }
}

module.exports = Logger;
