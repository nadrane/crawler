const path = require("path");
const loggerCreator = require("./core-logger");
const bunyanFactory = require("./buyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");

let logger;
module.exports = function createLogger(inputtedOuputFile) {
  let outputFile;
  if (!logger) {
    outputFile = inputtedOuputFile || path.join(LOGGING_DIR, "logs.txt");
    logger = loggerCreator(bunyanFactory, outputFile);
  }
  return logger;
};
