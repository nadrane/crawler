const path = require("path");
const Logger = require("./core-logger");
const bunyanFactory = require("./buyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");

let logger;
module.exports = function createLogger(eventCoordinator, inputtedOuputFile, logAdaptor = bunyanFactory) {
  let outputFile;
  if (!logger) {
    outputFile = inputtedOuputFile || path.join(LOGGING_DIR, "logs.txt");
    logger = new Logger(eventCoordinator, outputFile, logAdaptor);
  }
  return logger;
};
