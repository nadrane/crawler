const codeModule = "domains";

module.exports = logger => ({
  // fetchingUrl: () => {
  //   logger.debug({
  //     event: "fetching url",
  //     codeModule
  //   });
  // },

  domainFetched: domain => {
    logger.debug({
      event: "domain fetched",
      codeModule,
      domain
    });
  },

  noReadyDomains: () => {
    logger.debug({
      event: "no ready domains",
      codeModule
    });
  },

  // urlFetched: url => {
  //   logger.debug({
  //     event: "url fetched",
  //     codeModule,
  //     url
  //   });
  // },

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
});
