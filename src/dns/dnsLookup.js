const { URL } = require("url");
const LRU = require("lru-cache");
const { DNS_CACHE_SIZE } = require("APP/env");

class CachedDNS {
  constructor(logger, dns) {
    this.cache = new LRU({
      max: DNS_CACHE_SIZE
    });
    this.logger = logger;
    this.dns = dns;
  }

  async lookup(url) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (err) {
      this.logger.unexpectedError(err);
      return null;
    }
    let ipAddress = this._getIpAddressFromCache(parsedUrl.hostname);

    if (!ipAddress) {
      ipAddress = await this._getIpAddressFromDNS(parsedUrl.hostname);
    }

    if (!ipAddress) {
      return null;
    }

    parsedUrl.hostname = ipAddress;
    return parsedUrl.toString();
  }

  _getIpAddressFromCache(host) {
    let ipAddress;
    if (this.cache.has(host)) {
      this.logger.dns.cacheHit(host);
      ipAddress = this.cache.get(host);
    }
    this.logger.dns.cacheMiss(host);
    return ipAddress;
  }

  async _getIpAddressFromDNS(host) {
    let ipAddress;
    try {
      this.logger.dns.startingResolution(host);
      [ipAddress] = await this.dns.resolve(host);
      this.logger.dns.resolved(host, ipAddress);
    } catch (err) {
      console.error(err);
      this.logger.dns.resolutionFailed(host);
    }
    this.cache.set(host, ipAddress);
    return ipAddress;
  }
}

module.exports = CachedDNS;
