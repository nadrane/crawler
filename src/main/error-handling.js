const axios = require("axios");

module.exports = function configureProcessErrorHandling(logger, eventCoorindator) {
  process.on("uncaughtException", err => {
    logger.unexpectedError(err, "uncaught exception");
  });

  process.on("unhandledRejection", (reason, p) => {
    logger.unexpectedError(reason, "unhandled promise rejection", p);
  });

  // checkTerminationTime(eventCoorindator);
};

// function checkTerminationTime(eventCoorindator) {
//   const fiveSeconds = 1000 * 5;
//   setInterval(async () => {
//     const terminationInfo = await axios({
//       url: "http://169.254.169.254/latest/meta-data/spot/instance-action"
//     }).data;
//     if (terminationInfo) {
//       eventCoorindator.emit("stop");
//     }
//   }, fiveSeconds);
// }
