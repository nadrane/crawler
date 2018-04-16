const { Readable } = require("stream");
const Domains = require("./domains");

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

    eventCoordinator.on("stop", () => {
      if (!this.isPaused()) {
        logger.domains.crawlerStopped();
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
    if (this.domains.domainsAvailable()) {
      this._read();
    } else {
      this.timeout = setTimeout(this.reset.bind(this), 1000);
    }
  }

  _read() {
    if (this.isPaused()) {
      console.log("domain stream paused");
      clearTimeout(this.timeout);
      return;
    }

    const nextDomain = this.domains.getNextDomainToScrape();
    if (nextDomain) {
      this.push(nextDomain);
    } else {
      this.timeout = setTimeout(this.reset.bind(this), 1000);
    }
  }
}
