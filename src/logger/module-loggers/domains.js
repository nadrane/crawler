const { parse, getDomain } = require("tldjs");

const codeModule = "domains";

module.exports = logger => {
  return {
    addingToFrontier: (fromUrl, newUrl) => {
      const newDomain = getDomain(newUrl);
      const { domain, subdomain } = parse(fromUrl);
      // This happens sooo often, relegate it to trace level
      // to not pollute logs
      logger.trace({
        event: "new link",
        codeModule,
        fromUrl,
        newUrl,
        newDomain,
        domain,
        subdomain
      });
    },

    fetchingUrl: () => {
      logger.debug({
        event: "fetching url",
        codeModule
      });
    },

    noReadyDomains: () => {
      logger.debug({
        event: "no ready domains",
        codeModule
      });
    },

    urlFetched: url => {
      logger.debug({
        event: "url fetched",
        codeModule,
        url
      });
    },

    crawlerStopped: () => {
      logger.info({
        event: "crawler stopped",
        codeModule
      });
    },

    crawlerResumed: () => {
      logger.info({
        event: "crawler resumed",
        codeModule
      });
    }
  };
};
