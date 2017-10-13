const bluebird = require("bluebird");
const { parse } = require("tldjs");
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

class Logger {
  unexpectedError(err, data) {
    logger.error({ event: "unexpected error", err, data });
  }

  parserError(err) {
    logger.error({ event: "parser error", err });
  }

  GETResponseError(url, err, errorCode) {
    const domain = parse(domain)
    logger.info({ event: "response error", errorCode, err: err.message, url, domain});
  }

  addingToFrontier(fromUrl, newUrl) {
    const newDomain = parse(newUrl).domain;
    const fromDomain = parse(fromUrl).domain;
    logger.info({ event: "new link", fromUrl, fromDomain, newUrl, newDomain });
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
    logger.info({ event: "parsing finsihed", url, domain, totalResponsesParsed });
  }
}
module.exports = new Logger();
