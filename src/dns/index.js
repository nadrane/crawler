const throughConcurrent = require("../through-concurrent");
const CachedDNS = require("./dnsLookup");

module.exports = function createDnsStream(logger, dns, concurrency) {
  const cachedDNS = new CachedDNS(logger, dns);
  return throughConcurrent(logger, "dns stream", concurrency, async function(url, enc, done) {
    let urlWithIpAddress;
    try {
      urlWithIpAddress = await cachedDNS.lookup(url);
    } catch (err) {
      logger.dns.unexpectedError(err);
    }
    if (urlWithIpAddress) {
      this.push(urlWithIpAddress);
    }
    done();
  });
};
