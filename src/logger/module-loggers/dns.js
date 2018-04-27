const { parse, getDomain } = require("tldjs");

const codeModule = "dns";

module.exports = logger => ({
  startingResolution: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "starting resolution",
      codeModule,
      url,
      domain,
      subdomain
    });
  },

  resolved: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "resolved",
      codeModule,
      url,
      domain,
      subdomain
    });
  },

  resolutionFailed: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "resolution failed",
      codeModule,
      url,
      domain,
      subdomain
    });
  },

  cacheHit: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "cache hit",
      codeModule,
      url,
      domain,
      subdomain
    });
  },

  cacheMiss: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "cache miss",
      codeModule,
      url,
      domain,
      subdomain
    });
  }
});
