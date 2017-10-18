const bluebird = require("bluebird");
const { parse } = require("tldjs");
const { URL } = require("url");
const { appendFile } = require("fs");
const appendFileAsync = bluebird.promisify(appendFile);
const Bunyan = require("bunyan");

const logger = new Bunyan({
  name: "crawler",
  streams: [
    {
      level: "info",
      path: "./logs/info.txt"
    },
    {
      level: "error",
      path: "./logs/error.txt"
    },
    {
      level: "error",
      stream: process.stdout
    }
  ]
});

class RobotsError extends Error {

}


class CrawlerError extends Error {

}

class ParserError extends Error {

  }

class Logger {
  unexpectedError(err, data) {
    logger.error({ event: "unexpected error", err, data });
  }

  parserError(err, url) {
    logger.error({ event: "parser error", err, url });
  }

  noRobotsResponseReceived(module, err, url) {
    logger.info({module, event: "no robots response received", url})
  }

  GETResponseError(url, err, errorCode) {
    const domain = parse(url);
    logger.info({ event: "response error", errorCode, err: err.message, url, domain });
  }

  connectionReset(url) {
    const domain = parse(url);
    logger.info({ event: "connection reset", url, domain });
  }

  domainExhausted(domain) {
    logger.info({ event: "domain exhausted", domain});
  }

  addingToFrontier(fromUrl, newUrl) {
    const newDomain = parse(newUrl).domain;
    const fromDomain = parse(fromUrl).domain;
    logger.info({ event: "new link", fromUrl, fromDomain, newUrl, newDomain });
  }
  robotsRequestSent(url) {
    const { hostname } = new URL(url);
    logger.info({ event: "robots request sent", url, hostname });
  }
  GETRequestSent(url, totalRequestsMade) {
    const domain = parse(url).domain;
    logger.info({ event: "request sent", url, domain, totalRequestsMade });
  }

  GETResponseReceived(url, statusCode) {
    const domain = parse(url).domain;
    logger.info({ event: "response success", statusCode, url, domain });
  }

  connectionMade(url) {
    const domain = parse(url).domain;
    logger.info({ event: "new connection", url, domain });
  }

  finalizingCrawl(url, totalResponsesParsed) {
    const domain = parse(url).domain;
    logger.info({ event: "finalized crawl", url, domain, totalResponsesParsed });
  }
}
module.exports = new Logger();
