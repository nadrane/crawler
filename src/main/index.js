const { fork } = require("child_process");
const axios = require("axios");
const Events = require("events");
const argv = require("minimist")(process.argv.slice(2));
const configureProcessErrorHandling = require("./error-handling");
const { chunkByIndex } = require("../arrayUtilities");
const makeBloomFilterClient = require("../bloom-filter/client");
const makeLogger = require("../logger/");
const numCPUs = require("os").cpus().length;
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));

const {
  MAX_CONCURRENCY,
  SEED_FILE_PROMISE,
  SERVER_INFO,
  isDev,
  FRONTIER_DIRECTORY
} = require("../../env/");
const onDeath = require("death");

const { n, c, o, r } = argv; // number of machines | maximum file descriptors open | output file name | reset frontier
const numberOfMachines = n || 1;
const resetFrontier = r || false;
const maxConcurrency = c || MAX_CONCURRENCY;

const workers = [];
let statServer;

SERVER_INFO.then(async ({ statServerUrl, statServerPort, bloomFilterUrl }) => {
  const eventCoordinator = new Events();
  const logger = makeLogger(eventCoordinator, axios, { statServerUrl, statServerPort, outputFile: o });
  const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
  configureProcessErrorHandling(logger);
  configureServerTermination();
  if (resetFrontier) {
    await deleteFrontier();
  }
  startStatServer(statServerUrl, statServerPort);
  await bloomFilterClient.initializeBloomFilter();
  const seed = await SEED_FILE_PROMISE;
  console.log("seed file downloaded");
  const urlChunks = chunkByIndex(seed, numCPUs);
  createChildren(urlChunks, logger);
});

function deleteFrontier() {
  console.log("deleting frontier directory", FRONTIER_DIRECTORY);
  return rimraf(FRONTIER_DIRECTORY);
}

function startStatServer(statServerUrl, statServerPort) {
  if (isDev()) {
    console.log("starting stat server");
    statServer = fork("./statistics/startServer", [statServerUrl, statServerPort], {
      env: { NODE_ENV: process.env.NODE_ENV }
    });
  }
}

function createChildren(urlChunks, logger) {
  for (let i = 0; i < 1; i++) {
    const child = fork("./src/main/child-process", [urlChunks[i], maxConcurrency]);
    workers.push(child);
    logger.spawningWorkerProcess(child.pid);
  }
}

function configureServerTermination() {
  onDeath(() => {
    if (isDev() && !statServer.killed) {
      statServer.kill();
    }
    console.log(`${process.pid}: server terminated, killing children`);
    for (const worker of workers) {
      if (worker.connected) {
        worker.disconnect();
      }
    }
    process.exit();
  });
}
