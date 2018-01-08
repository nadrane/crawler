module.exports = function configureProcessErrorHandling(logger) {
  process.on("uncaughtException", err => {
    logger.unexpectedError(err, "uncaught exception");
  });

  process.on("unhandledRejection", (reason, p) => {
    logger.unexpectedError(reason, "unhandled promise rejection", p);
  });
};
