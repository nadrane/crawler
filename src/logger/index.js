const path = require("path");
const loggerCreator = require("./core-logger");
const bunyanFactory = require("./buyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");

let logger;
module.exports = function(outputFile) {
  if (!logger) {
    if (!outputFile) {
      outputFile = path.join(LOGGING_DIR, "logs.txt");
    }
    logger = loggerCreator(bunyanFactory, outputFile);
  }
  return logger;
};
