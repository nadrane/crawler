const { DOMAIN_REQUEST_TIME_INTERVAL } = require("APP/env");

class DomainTracker {
  constructor(domain) {
    this._domain = domain;
    this.lastScraped = 0; // A really early time so it will definitely be scrapped.
  }

  get domain() {
    this._updateTimeLastScraped();
    return this._domain;
  }

  _updateTimeLastScraped() {
    this.lastScraped = Date.now();
    return this.lastScraped;
  }

  politeToScrape() {
    return this.lastScraped + DOMAIN_REQUEST_TIME_INTERVAL <= Date.now();
  }
}

module.exports = DomainTracker;
