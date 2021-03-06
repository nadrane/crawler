const { Readable } = require("stream");
const Domains = require("./domains");
const { DOMAIN_READ_DELAY } = require("APP/env/");

module.exports = function makeDomainStream(seedData, eventCoordinator, logger) {
  const domainStream = new DomainReaderStream(logger, seedData, eventCoordinator);

  domainStream.on("error", err => {
    logger.unexpectedError(err, "domain stream");
  });

  return domainStream;
};

class DomainReaderStream extends Readable {
  constructor(logger, seedData, eventCoordinator) {
    super({ objectMode: true });
    this.domains = new Domains(seedData, logger);
    this.timeout = null;
    this.tillNextRead = DOMAIN_READ_DELAY;
    this.pause();

    eventCoordinator.on("stop", () => {
      if (!this.isPaused()) {
        logger.domains.crawlerStopped();
        console.log("pausing");
        this.pause();
      }
    });
    eventCoordinator.on("start", () => {
      if (this.isPaused()) {
        logger.domains.crawlerResumed();
        this.resume();
      }
    });
  }

  reset() {
    this.timeout = null;
    if (this.domains.domainsAvailable()) {
      this._read();
    } else {
      this.timeout = setTimeout(this.reset.bind(this), 1000);
    }
  }

  _destroy(err, cb) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    super._destroy(err, cb);
  }

  _read() {
    setTimeout(() => {
      this.getDomain();
    }, this.tillNextRead);
  }

  getDomain() {
    const nextDomain = this.domains.getNextDomainToScrape();
    if (nextDomain) {
      this.push(nextDomain);
    } else if (!this.timeout) {
      this.timeout = setTimeout(this.reset.bind(this), 1000);
    }
  }
}
