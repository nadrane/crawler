const codeModule = "frontier";

module.exports = logger => {
  return {
    frontierExistsCheckFailed: (err, domain) => {
      logger.fatal({
        err,
        domain,
        codeModule
      });
    },

    corruptFileConfiguration: (err, domain) => {
      logger.fatal({
        err,
        domain,
        codeModule
      });
    },

    corruptFileConfiguration: (err, domain) => {
      logger.fatal({
        err,
        domain,
        codeModule
      });
    },

    frontierIndexWriteFailure: (err, domain) => {
      logger.fatal({
        err,
        domain,
        codeModule
      });
    }
  };
};
