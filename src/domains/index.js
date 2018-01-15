const { Readable } = require("stream");
const Domains = require("./domains");

module.exports = function makeDomainStream(seedData, eventCoordinator, storage, logger, concurrency) {
  const domains = new Domains(seedData, eventCoordinator, storage, logger);
  const domainStream = new DomainReaderStream(logger, domains, eventCoordinator, concurrency);

  domainStream.on("error", err => {
    logger.unexpectedError(err, "domain stream");
  });

  return domainStream;
};

class DomainReaderStream extends Readable {
  constructor(logger, domains, eventCoordinator, concurrency) {
    super({ objectMode: true });
    this.concurrency = concurrency;
    this.buffer = [];
    this.domains = domains;
    this.backPressure = false;
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
    // Since _read is not called until this.push is called,
    // if we run out of urls, we need to make sure we check again eventually
    // You'd think we could do this inside the callback of getNextUrlToScrape
    // on the condition that countOpenFiles === 0. The thing is, if there are
    // no domains ready for scraping, when getNextUrlToScrape is called,
    // the number of open files will remain unchanged. This means that
    // we will get not one but ~50 instances where countOpenFiles === 0
    setInterval(() => {
      this._getDomain();
    }, 5 * 1000);
  }

  /* _read will not get called a second time until push has been called
  this is why we have the while loop below
  */
  _read() {
    this.backPressure = false;
    if (this.buffer.length) {
      const url = this.buffer.shift();
      if (!this.push(url)) {
        this.backPressure = true;
      }
      return;
    }
    this._getDomain();
  }

  async _getDomain() {
    let requestsKickedOff = 0;
    while (requestsKickedOff++ < this.concurrency) {
      if (this.domains.countOpenFiles() >= this.concurrency) return;
      let url;
      try {
        url = await this.domains.getNextUrlToScrape();
      } catch (err) {
        console.log("err", err);
        // logger.domainStreamError(err);
      }
      // Eventually there are no domains ready for scraping and "" is returned
      if (!url) return;
      if (this.backPressure) {
        this.buffer.push(url);
      } else if (!this.push(url)) {
        this.backPressure = true;
      }
    }
  }
}
