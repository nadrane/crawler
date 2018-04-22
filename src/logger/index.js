const path = require("path");
const Logger = require("./core-logger");
const makeBunyanLogger = require("./bunyan-adaptor");
const { LOGGING_DIR } = require("APP/env/");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const mkdirp = require("mkdirp");

module.exports = function createLogger(
  http,
  { statServerHost, statServerPort, outputFile } = {
    statServerHost: "",
    statServerPort: "",
    outputFile: ""
  }
) {
  outputFile = outputFile || LOGGING_DIR ? path.join(LOGGING_DIR, "logs.txt") : "";

  if (outputFile) {
    mkdirp.sync(path.dirname(outputFile));
    rimraf.sync(outputFile);
  }

  if (statServerHost && !statServerHost.startsWith("http://")) {
    statServerHost = `http://${statServerHost}`;
  }

  const bunyanLogger = makeBunyanLogger({
    http,
    outputFile,
    url: `${statServerHost}:${statServerPort}`
  });

  return new Logger(bunyanLogger);
};
