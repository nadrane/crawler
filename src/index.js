var argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
let { c, o } = argv; // maximum file descriptors open | output file name
const env = require("../env/");

const maxConcurrency = c || env.MAX_CONCURRENCY;
let logFile;

if (o) {
  logFile = path.join(env.LOGGING_DIR, o);
} else {
  logFile = path.join(env.LOGGING_DIR, "logs.txt");
}
const logger = require("./logger")(logFile);

const robotsStream = require("./robots-parser/")(maxConcurrency);
robotsStream.on("error", err => {
  logger.unexpectedError(err, "robots stream error")
});

const requestStream = require("./requester/")(maxConcurrency);
requestStream.on("error", err => {
  logger.unexpectedError(err, 'request stream error')
});

env.SEED_FILE_PROMISE.then(seedFile => {
  const domainStream = require("./domains")(maxConcurrency, seedFile);

  domainStream.on("error", err => {
    logger.unexpectedError(err, 'domain stream error')
  });

  domainStream
    .pipe(robotsStream)
    .pipe(requestStream)
    .pipe(process.stdout);
});

process.on("uncaughtException", function(err) {
  logger.unexpectedError(err, "uncaught exception");
});

process.on("unhandledRejection", (reason, p) => {
  logger.unexpectedError(reason, "unhandled promise rejection", p);
});
