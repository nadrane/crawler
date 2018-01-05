const path = require("path");
const mkdirp = require("mkdirp");
const Events = require("events");
const env = require("../../env/");

const eventCoorindator = new Events();

function configureHeapDumps() {
  if (env.isDev()) {
    const heapdump = require("heapdump");
    const debugDir = path.join(env.LOGGING_DIR, "heap-dumps");
    mkdirp(debugDir);
    setInterval(() => {
      heapdump.writeSnapshot(path.join(debugDir, `${Date.now()}.heapsnapshot`));
    }, 10 * 1000);
  }
}
configureHeapDumps();

function configureProcessErrorHandling(logger) {
  process.on("uncaughtException", err => {
    logger.unexpectedError(err, "uncaught exception");
  });

  process.on("unhandledRejection", (reason, p) => {
    logger.unexpectedError(reason, "unhandled promise rejection", p);
  });
}

function initialization(maxConcurrency, logFile) {
  const logger = require("../logger")(logFile);
  configureProcessErrorHandling(logger);

  const bloomFilterCheckStream = require("../bloom-filter/check-stream")(maxConcurrency);
  const bloomFilterSetStream = require("../bloom-filter/set-stream")(maxConcurrency);
  const robotsStream = require("../robots-parser/")(maxConcurrency);
  const requestStream = require("../requester/")(maxConcurrency, eventCoorindator);

  const seedFile = new Promise(resolve => {
    process.on("message", data => {
      resolve(data);
    });
  });

  seedFile
    .then(seedData => {
      const domainStream = require("../domains")(maxConcurrency, seedData, eventCoorindator);

      domainStream.on("error", err => {
        logger.unexpectedError(err, "domain stream");
      });

      domainStream.pipe(bloomFilterCheckStream).pipe(process.stdout);
      // .pipe(robotsStream)
      // .pipe(bloomFilterSetStream) // notice we mark it visited before visiting. If we the request fails, it fails for good
      // .pipe(requestStream)
      // .pipe(process.stdout);
    })
    .catch(err => {
      console.error("init error", err);
    });
}

module.exports = initialization;
