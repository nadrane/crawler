const bluebird = require("bluebird");
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
  unexpectedError(message, err) {
    logger.error({ event: "unexpected error", err, message });
  }

  GETResponseError(url, err, errorCode) {
    logger.info({ event: "response error", errorCode, err: err.message, url });
  }

  addingToFrontier(fromUrl, newUrl) {
    logger.info({ event: "new link", fromUrl, newUrl})
  }

  GETRequestSent(url) {
    logger.info({ event: "request sent", url})
  }

  GETResponseReceived(url, statusCode) {
    logger.info({ event: "response success", statusCode, url})
  }

  connectionMade(url) {
    logger.info({ event: "new connection", url })
  }

  finalizingCrawl(url) {
    logger.info({ event: "parsing finsihed", url})
  }
}
module.exports = new Logger();
