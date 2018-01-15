const { getDomain } = require("tldjs");

const codeModule = "robots parser";

module.exports = logger => {
  return {
    requestSent: url => {
      const domain = getDomain(url);
      logger.info({
        event: "request sent",
        codeModule,
        url,
        domain
      });
    },

    requestTimeout: url => {
      const domain = getDomain(url);
      logger.info({
        event: "request timeout",
        codeModule,
        url,
        domain
      });
    },

    noResponseReceived: (err, url) => {
      const domain = getDomain(url);
      logger.info({
        event: "no response received",
        codeModule,
        url,
        domain
      });
    },

    cacheHit: url => {
      const domain = getDomain(url);
      logger.info({
        event: "cache hit",
        codeModule,
        url,
        domain
      });
    },

    cacheMiss: url => {
      const domain = getDomain(url);
      logger.info({
        event: "cache miss",
        codeModule,
        url,
        domain
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
    }
  };
};
