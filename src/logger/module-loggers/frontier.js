const codeModule = "frontier";

module.exports = logger => ({
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
