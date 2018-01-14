const axios = require("axios");
const fs = require("fs");
const Events = require("events");

const configureProcessErrorHandling = require("./error-handling");
const makeBloomFilterSetStream = require("../bloom-filter/set-stream");
const makeBloomFilterCheckStream = require("../bloom-filter/check-stream");
const makeRobotsStream = require("../robots-parser/");
const makeRequestStream = require("../requester/");
const makeDomainStream = require("../domains/");
const makeBloomFilterClient = require("../bloom-filter/client");
const makeLogger = require("../logger/");
const { SERVER_INFO } = require("../../env/");

const eventCoorindator = new Events();

function initializeChildProcess(seedData, logger, http, storage, bloomFilterClient, maxConcurrency) {
  configureProcessErrorHandling(logger);
  process.on("disconnect", () => {
    console.log(process.pid, "disconnected");
  });

  const domainStream = makeDomainStream(seedData, eventCoorindator, storage, logger, maxConcurrency);
  const bloomFilterCheckStream = makeBloomFilterCheckStream(bloomFilterClient, logger, maxConcurrency);
  const bloomFilterSetStream = makeBloomFilterSetStream(bloomFilterClient, logger, maxConcurrency);
  const robotsStream = makeRobotsStream(logger, axios, maxConcurrency);
  const requestStream = makeRequestStream(logger, axios, eventCoorindator, maxConcurrency);

  domainStream
    .pipe(bloomFilterCheckStream)
    .pipe(robotsStream)
    .pipe(bloomFilterSetStream) // notice we mark it visited before visiting. If we the request fails, it fails for good
    .pipe(requestStream)
    .pipe(process.stdout);
}

// Only run if forked from main process
if (require.main === module) {
  SERVER_INFO.then(({ statServerUrl, statServerPort, bloomFilterUrl }) => {
    const seedData = process.argv.slice(2)[0].split(",");
    const maxConcurrency = process.argv.slice(2)[1];
    const logger = makeLogger(eventCoorindator, axios, { statServerUrl, statServerPort });
    const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
    initializeChildProcess(seedData, logger, axios, fs, bloomFilterClient, maxConcurrency);
  });
}

module.exports = initializeChildProcess;
