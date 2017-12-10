const { SEED_FILE_PROMISE } = require("APP/env");
const { Readable } = require("stream");
const domainFactoryPromise = require("./domains")(SEED_FILE_PROMISE);

class DomainReaderStream extends Readable {
  constructor(domainFactory, concurrency) {
    super({ objectMode: true });
    const outstandingRequests = 0;
    this.concurrency = concurrency;
    this.buffer = []
    this.domainFactory = domainFactory
  }

  _read(size) {
    if (!this.domainFactory) {
      return
    }
    if (this.running > this.concurrency) {
      return
    }
    if (this.buffer.length) {
      const url = this.buffer.shift();
      const isBackPressure = !this.push(url)
      if (isBackPressure) {
        this.buffer.unshift(url)
      }
      return
    }
    this.outstandingRequests++;
    this.domainFactory
      .getNextUrlToScrape()
      .then(url => {
        this.running--;
        const isBackPressure = !this.push(url + '\n')
        if (isBackPressure) {
          this.buffer.push(url)
        }
      })
      .catch(err => {
        this.running--;
        return this.emit("error", err);
      });
  }
}

module.exports = domainFactoryPromise
  .then(domainFactory => {
    return new DomainReaderStream(domainFactory)
  })
