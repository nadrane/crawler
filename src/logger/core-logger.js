const mkdirp = require("mkdirp");
const path = require("path");

const makeDomainsLogger = require("./module-loggers/domains");
const makeBloomFilterLogger = require("./module-loggers/bloom-filter");
const makeRobotsLogger = require("./module-loggers/robots-parser");
const makeRequesterLogger = require("./module-loggers/requester");
const makeFrontierLogger = require("./module-loggers/frontier");

class Logger {
  constructor(eventCoordinator, outputFile, makeLogAdaptor) {
    mkdirp.sync(path.dirname(outputFile));
    const logAdaptor = makeLogAdaptor(outputFile);
    this.lastFiveUnexpected = [];
    this.eventCoordinator = eventCoordinator;
    this.logger = makeLogAdaptor(outputFile);

    this.domains = this._addUnexpectedError(makeDomainsLogger(logAdaptor), "domains");
    this.bloomFilter = this._addUnexpectedError(makeBloomFilterLogger(logAdaptor), "bloom filter");
    this.robots = this._addUnexpectedError(makeRobotsLogger(logAdaptor), "robots");
    this.requester = this._addUnexpectedError(makeRequesterLogger(logAdaptor), "requester");
    this.frontier = this._addUnexpectedError(makeFrontierLogger(logAdaptor), "frontier");
  }

  _addUnexpectedError(moduleLogger, codeModule) {
    const unexpectedError = (err, event, data) => {
      this.unexpectedError(err, event, data, codeModule);
    };
    return Object.assign({ unexpectedError }, moduleLogger);
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

  unexpectedError(err, event, data, codeModule) {
    this.logger.error({ err, codeModule, event, data });
    this.trackUnexpectedErrors();
  }

  spawningWorkerProcess(processId) {
    this.logger.info({
      event: "spawning worker process",
      processId
    });
  }
}

module.exports = Logger;
