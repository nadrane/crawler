const axios = require("axios");
const fs = require("fs");
const Events = require("events");
const through2 = require("through2");

const configureProcessErrorHandling = require("./error-handling");
const makeDomainStream = require("../domains/");
const makeDomainToUrlStream = require("../frontiers");
const makeBloomFilterSetStream = require("../bloom-filter/set-stream");
const makeBloomFilterCheckStream = require("../bloom-filter/check-stream");
const makeRobotsStream = require("../robots-parser/");
const makeRequestStream = require("../requester/");
const makeBloomFilterClient = require("../bloom-filter/client");
const makeLogger = require("../logger/");
const { SERVER_INFO } = require("../../env/");

const eventCoordinator = new Events();

// Only run if forked from main process
if (require.main === module) {
  SERVER_INFO.then(async ({ statServerUrl, statServerPort, bloomFilterUrl }) => {
    const seedData = process.argv.slice(2)[0].split(",");
    const maxConcurrency = process.argv.slice(2)[1];
    const logger = await makeLogger(eventCoordinator, axios, { statServerUrl, statServerPort });
    const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
    initializeChildProcess(seedData, logger, axios, fs, bloomFilterClient, maxConcurrency);
  });
}

function initializeChildProcess(
  seedData,
  logger,
  http,
  storage,
  bloomFilterClient,
  maxConcurrency
) {
  process.title = "crawler - child";
  configureProcessErrorHandling(logger);
  process.on("disconnect", () => {
    console.log(process.pid, "disconnected");
  });

  const domainStream = makeDomainStream(seedData, eventCoordinator, logger, maxConcurrency);
  const domainToUrlStream = makeDomainToUrlStream(
    seedData,
    logger,
    eventCoordinator,
    storage,
    maxConcurrency
  );
  const bloomFilterCheckStream = makeBloomFilterCheckStream(
    bloomFilterClient,
    logger,
    maxConcurrency
  );
  const bloomFilterSetStream = makeBloomFilterSetStream(bloomFilterClient, logger, maxConcurrency);
  // const robotsStream = makeRobotsStream(
  //   logger,
  //   responseTimeTrackingHttp(logger, "robots"),
  //   maxConcurrency
  // );
  const requestStream = makeRequestStream(
    logger,
    responseTimeTrackingHttp(logger, "requester"),
    eventCoordinator,
    maxConcurrency
  );

  domainStream
    .pipe(domainToUrlStream)
    // .pipe(robotsStream)
    .pipe(requestStream)
    .pipe(bloomFilterCheckStream)
    .pipe(bloomFilterSetStream) // notice we mark it visited before visiting. We will only try to visit each url 1 time
    .pipe(through2.obj(function(url, enc, cb) {
      eventCoordinator.emit("new link", {
        newUrl: url,
        fromUrl: ""
      });
      this.push(`${url}\n`);
      cb();
    }))
    .pipe(fs.createWriteStream("/dev/null"));
}

function responseTimeTrackingHttp(logger, codeModule) {
  const trackingHttp = axios.create();
  trackingHttp.interceptors.request.use(config => Object.assign({ startTime: Date.now() }, config));

  trackingHttp.interceptors.response.use(response => {
    const { startTime } = response.config;
    const responseDuration = Date.now() - startTime;
    logger[codeModule].trackResponseTime(response.url, responseDuration);
    return response;
  });
  return trackingHttp;
}

module.exports = initializeChildProcess;
