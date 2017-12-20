const { SEED_FILE_PROMISE } = require("APP/env");
const { Readable } = require("stream");
const Domains = require("./domains");

class DomainReaderStream extends Readable {
  constructor(domains, concurrency) {
    super({ objectMode: true });
    this.outstandingRequests = 0;
    this.concurrency = concurrency;
    this.buffer = [];
    this.domains = domains;
    this.backPressure = false;

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
  _read(size) {
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

  _getDomain() {
    let requestsKickedOff = 0;
    while (requestsKickedOff++ < this.concurrency) {
      if (this.domains.countOpenFiles() >= this.concurrency) return;
      this.domains
        .getNextUrlToScrape()
        .then(url => {
          // Eventually there are no domains ready for scraping and "" is returned
          if (!url) return;
          if (this.backPressure) {
            this.buffer.push(url);
            return;
          } else if (!this.push(url)) {
            this.backPressure = true;
          }
        })
        .catch(err => {
          this.outstandingRequests--;
          return this.emit("error", err);
        });
    }
  }
}

module.exports = function(concurrency, seedFile, eventCoordinator) {
   return new DomainReaderStream(new Domains(seedFile, eventCoordinator), concurrency);
};
