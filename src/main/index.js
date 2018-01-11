const cluster = require("cluster");
const childProcess = require("child_process");
const Events = require("events");
const initializeChildProcess = require("./child-process");
const argv = require("minimist")(process.argv.slice(2));
const axios = require("axios");
const configureProcessErrorHandling = require("./error-handling");
const { chunkByIndex } = require("../arrayUtilities");
const makeBloomFilterClient = require("../bloom-filter/client");
const makeLogger = require("../logger/");
const numCPUs = require("os").cpus().length;
const { MAX_CONCURRENCY, SEED_FILE_PROMISE, SERVER_INFO, isDev } = require("../../env/");
const onDeath = require("death");

const { n, c, o } = argv; // number of machines | maximum file descriptors open | output file name
const numberOfMachines = n || 1;
const maxConcurrency = c || MAX_CONCURRENCY;

let statServer;
const workers = [];

SERVER_INFO.then(async ({ statServerUrl, statServerPort, bloomFilterUrl }) => {
  const eventCoordinator = new Events();
  const logger = makeLogger(eventCoordinator, axios, { statServerUrl, statServerPort, outputFile: o });
  const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
  configureProcessErrorHandling(logger);

  if (cluster.isMaster) {
    configureServerTermination();
    startStatServer(statServerUrl, statServerPort);
    await bloomFilterClient.initializeBloomFilter();
    const seed = await SEED_FILE_PROMISE;
    console.log("seed file downloaded");
    createChildren(logger, chunkByIndex(seed, numCPUs), bloomFilterClient);
  } else {
    console.log("initializing child with pid", process.pid);
    initializeChildProcess(logger, eventCoordinator, bloomFilterClient, maxConcurrency);
  }
});

function startStatServer(statServerUrl, statServerPort) {
  if (isDev()) {
    console.log("starting stat server");
    statServer = childProcess.fork("./statistics/startServer", [statServerUrl, statServerPort], {
      env: { NODE_ENV: process.env.NODE_ENV }
    });
  }
}

function createChildren(logger, urlChunks) {
  for (let i = 0; i < numCPUs; i++) {
    const child = cluster.fork();
    workers.push(child);
    logger.spawningWorkerProcess(child.pid);
    child.send(urlChunks[i]);
  }
}

function configureServerTermination() {
  onDeath(() => {
    if (isDev() && !statServer.killed) {
      statServer.kill();
    }
    console.log(`${process.pid}: server terminated, killing children`);
    workers.forEach(worker => {
      if (worker.isConnected()) {
        worker.disconnect();
      }
    });
    process.exit();
  });
}
