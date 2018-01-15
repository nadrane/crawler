const { getDomain } = require("tldjs");

const codeModule = "domains";

module.exports = logger => {
  return {
    addingToFrontier: (fromUrl, newUrl) => {
      const newDomain = getDomain(newUrl);
      const fromDomain = getDomain(fromUrl);
      logger.info({
        event: "new link",
        codeModule,
        fromUrl,
        fromDomain,
        newUrl,
        newDomain,
        domain: fromDomain // stats server needs the domain fields
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
