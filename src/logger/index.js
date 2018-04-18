const path = require("path");
const Logger = require("./core-logger");
const bunyanWithHTTPStream = require("./bunyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));

module.exports = async function createLogger(
  eventCoordinator,
  http,
  { statServerUrl, statServerPort, outputFile } = {
    statServerUrl: "localhost",
    statServerPort: "8080"
  }
) {
  if (!eventCoordinator) throw new Error("event coordinator expected");
  outputFile = outputFile || path.join(LOGGING_DIR, "logs.txt");
  await rimraf(outputFile);
  if (!statServerUrl.startsWith("http://")) {
    statServerUrl = `http://${statServerUrl}`;
  }
  const bunyanHTTPStream = bunyanWithHTTPStream(`${statServerUrl}:${statServerPort}/log`, http);
  return new Logger(eventCoordinator, outputFile, bunyanHTTPStream);
};
