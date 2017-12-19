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

const bloomFilter = require('./bloom-filter/bloom-filter')

const bloomFilterCheckStream = require('./bloom-filter/check-stream')(maxConcurrency)
const bloomFilterSetStream = require('./bloom-filter/set-stream')(maxConcurrency)
const robotsStream = require("./robots-parser/")(maxConcurrency);
const requestStream = require("./requester/")(maxConcurrency);

initialization().then(([seedFile]) => {
  const domainStream = require("./domains")(maxConcurrency, seedFile);

  domainStream.on("error", err => {
    logger.unexpectedError(err, 'domain stream')
  });

  domainStream
    .pipe(bloomFilterCheckStream)
    .pipe(robotsStream)
    .pipe(bloomFilterSetStream)  // notice we mark it visited before visiting. If we the request fails, it fails for good
    .pipe(requestStream)
    .pipe(process.stdout);
});

process.on("uncaughtException", function(err) {
  logger.unexpectedError(err, "uncaught exception");
});

process.on("unhandledRejection", (reason, p) => {
  logger.unexpectedError(reason, "unhandled promise rejection", p);
});

function initialization() {
  const createBloomFilter = bloomFilter.create()
  const seedFile = env.SEED_FILE_PROMISE
  return Promise.all([seedFile, createBloomFilter])
}