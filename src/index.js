var argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
const { c, o } = argv; // maximum file descriptors open | output file name
const logger = require("./logger")("temp-log.txt");

const concurrency = 10;
const robotsStream = require("./robots-parser/")(concurrency);
const requestStream = require("./requester/")(concurrency);

require("./domains")(concurrency).then(domainReader => {
  domainReader
    .pipe(robotsStream)
    .pipe(requestStream)
    .pipe(process.stdout)
});

process.on("uncaughtException", function(err) {
  logger.unexpectedError(err, "uncaught exception");
});

process.on("unhandledRejection", (reason, p) => {
  logger.unexpectedError(reason, "unhandled promise rejection", p);
});
