const path = require("path");
const Logger = require("./core-logger");
const bunyanWithHTTPStream = require("./bunyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");

let logger;
module.exports = function createLogger(eventCoordinator, http, statServerUrl, inputtedOuputFile) {
  let outputFile;
  if (!logger) {
    // if (!eventCoordinator) throw new Error("event coordinator expected");
    outputFile = inputtedOuputFile || path.join(LOGGING_DIR, "logs.txt");
    logger = new Logger(eventCoordinator, outputFile, bunyanWithHTTPStream(statServerUrl, http));
  }
  return logger;
};
