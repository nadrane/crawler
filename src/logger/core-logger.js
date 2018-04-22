const makeDomainsLogger = require("./module-loggers/domains");
const makeBloomFilterLogger = require("./module-loggers/bloom-filter");
const makeRobotsLogger = require("./module-loggers/robots");
const makeRequesterLogger = require("./module-loggers/requester");
const makeFrontierLogger = require("./module-loggers/frontier");

class Logger {
  constructor(logAdaptor) {
    this.logger = logAdaptor;
    this.lastFiveUnexpected = [];

    this.domains = this._addUnexpectedError(makeDomainsLogger(this.logger), "domains");
    this.bloomFilter = this._addUnexpectedError(makeBloomFilterLogger(this.logger), "bloom filter");
    this.robots = this._addUnexpectedError(makeRobotsLogger(this.logger), "robots");
    this.requester = this._addUnexpectedError(makeRequesterLogger(this.logger), "requester");
    this.frontiers = this._addUnexpectedError(makeFrontierLogger(this.logger), "frontiers");
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
    this.logger.error({
      err,
      codeModule,
      event,
      data
    });
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
