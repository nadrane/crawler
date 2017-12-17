var argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
const { c, o } = argv; // maximum file descriptors open | output file name
const logger = require("./logger")("temp-log.txt");

const concurrency = 5;

const robotsStream = require("./robots-parser/")(concurrency);
robotsStream.on("error", err => {
  console.error('robots stream error', err)
})

const requestStream = require("./requester/")(concurrency);
requestStream.on("error", err => {
  console.error('requests stream error', err)
})

require("./domains")(concurrency).then(domainReader => {
  domainReader.on("error", err => {
    console.error('domain reader stream error', err)
  })

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
