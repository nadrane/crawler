const axios = require("axios");
const fs = require("fs");
// const enableHeapDumps = require("./heap-dumps");
const makeBloomFilterSetStream = require("../bloom-filter/set-stream");
const makeBloomFilterCheckStream = require("../bloom-filter/check-stream");
const makeRobotsStream = require("../robots-parser/");
const makeRequestStream = require("../requester/");
const makeDomainStream = require("../domains/");
// enableHeapDumps();

module.exports = async function initializeChildProcess(
  logger,
  eventCoorindator,
  bloomFilterClient,
  maxConcurrency
) {
  const seedFile = new Promise(resolve => {
    process.on("message", data => {
      resolve(data);
    });
  });

  process.on("disconnect", () => {
    console.log(process.pid, "disconnected");
  });

  let seedData;
  try {
    seedData = await seedFile;
  } catch (err) {
    console.error(err, "Could not retrieve seed data from server");
  }
  const domainStream = makeDomainStream(seedData, eventCoorindator, fs, logger, maxConcurrency);
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
};
