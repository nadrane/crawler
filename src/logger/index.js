const path = require("path");
const Logger = require("./core-logger");
const bunyanWithHTTPStream = require("./bunyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");

module.exports = function createLogger(
  eventCoordinator,
  http,
  { statServerUrl, statServerPort, outputFile } = {}
) {
  if (!eventCoordinator) throw new Error("event coordinator expected");
  outputFile = outputFile || path.join(LOGGING_DIR, "logs.txt");
  return new Logger(
    eventCoordinator,
    outputFile,
    bunyanWithHTTPStream(`${statServerUrl}:${statServerPort}/log`, http)
  );
};
