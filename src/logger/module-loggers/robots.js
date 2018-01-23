const { parse } = require("tldjs");

const codeModule = "robots";

module.exports = logger => {
  return {
    requestSent: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "request sent",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    requestTimeout: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "request timeout",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    noResponseReceived: (err, url) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "no response received",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    unexpectedStatusCode: url => {
      const { domain, subdomain } = parse(url);
      logger.error({
        event: "unexpected status code",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    cacheHit: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "cache hit",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    cacheMiss: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "cache miss",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    streamEntered: () => {
      logger.debug({
        event: "stream entered",
        codeModule
      });
    },

    streamExited: () => {
      logger.debug({
        event: "stream exited",
        codeModule
      });
    },

    trackResponseTime: (url, responseTime) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "track response time",
        codeModule,
        url,
        domain,
        subdomain,
        data: responseTime
      });
    }
  };
};
