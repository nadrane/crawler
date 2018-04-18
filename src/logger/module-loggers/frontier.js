const { parse, getDomain } = require("tldjs");

const codeModule = "frontiers";

module.exports = logger => ({
  retrievedNextUrl: url => {
    const { domain, subdomain } = parse(url);
    logger.debug({
      event: "retrieved next url",
      codeModule,
      url,
      domain,
      subdomain
    });
  },

  appendingUrl: (fromUrl, newUrl) => {
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

  indexFlushedWithoutLock: filePaths => {
    logger.fatal({
      event: "index flushed without lock",
      codeModule,
      filePaths
    });
  },

  frontierExistsCheckFailed: (err, domain) => {
    logger.fatal({
      err,
      event: "frontier exists check failed",
      domain,
      codeModule
    });
  },

  frontierFilesCorrupt: (err, domain) => {
    logger.fatal({
      err,
      event: "frontier files corrupt",
      domain,
      codeModule
    });
  },

  appendUrlFailed: (err, domain) => {
    logger.fatal({
      err,
      event: "append url failed",
      domain,
      codeModule
    });
  },

  readUrlFailed: (err, domain) => {
    logger.fatal({
      err,
      event: "read url failed",
      domain,
      codeModule
    });
  },

  frontierIndexWriteFailure: (err, domain) => {
    logger.fatal({
      err,
      event: "frontier index write failed",
      domain,
      codeModule
    });
  },

  failedToReadFrontier: (err, domain) => {
    logger.fatal({
      err,
      event: "failed to read frontier",
      domain,
      codeModule
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
});
