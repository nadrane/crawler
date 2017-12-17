var argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
const { c, o } = argv; // maximum file descriptors open | output file name
const logger = require("./logger")("temp-log.txt");

c = c || 5; // defalt concurrency

const robotsStream = require("./robots-parser/")(c);
robotsStream.on("error", err => {
  console.error('robots stream error', err)
})

const requestStream = require("./requester/")(c);
requestStream.on("error", err => {
  console.error('requests stream error', err)
})

// I should really fix this.
// domains should not return a promise.
// We need to pass in the env config (seed file) to file this
// That way we can pull the async handling all out here
require("./domains")(c).then(domainReader => {
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
