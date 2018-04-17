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
const posix = require("posix");

const {
  MAX_CONCURRENCY,
  SEED_FILE_PROMISE,
  SERVER_INFO,
  MACHINE_INDEX,
  isDev,
  isProd,
  FRONTIER_DIRECTORY
} = require("../../env/");
const onDeath = require("death");

const { c, o, r } = argv; // maximum file descriptors open | output file name | reset frontier
const resetFrontier = r || false;
const maxConcurrency = c || MAX_CONCURRENCY;

const workers = [];
let statServer;

let numberOfMachines;
if (isProd()) {
  numberOfMachines = 20;
} else {
  numberOfMachines = 1;
}

process.title = "crawler - parent";
posix.setrlimit("nofile", { soft: 10000 });

SERVER_INFO.then(async ({ statServerUrl, statServerPort, bloomFilterUrl }) => {
  const eventCoordinator = new Events();
  const logger = await makeLogger(eventCoordinator, axios, {
    statServerUrl,
    statServerPort,
    outputFile: o
  });
  const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
  configureProcessErrorHandling(logger);
  configureServerTermination();
  if (resetFrontier) {
    await deleteFrontier();
  }
  try {
    await bloomFilterClient.initializeBloomFilter();
  } catch (err) {
    console.log("bloom filter initialization failed.");
    process.exit(1);
  }
  startStatServer(statServerUrl, statServerPort);
  const machineIndex = await MACHINE_INDEX;
  const seed = await SEED_FILE_PROMISE;
  console.log("seed file downloaded");
  const thisMachinesSeed = chunkByIndex(seed, numberOfMachines)[machineIndex];
  const urlChunks = chunkByIndex(thisMachinesSeed, numCPUs);
  createChildren(urlChunks, logger);
});

async function deleteFrontier() {
  console.log("deleting frontier directory", FRONTIER_DIRECTORY);
  try {
    await rimraf(FRONTIER_DIRECTORY);
  } catch (err) {
    console.err(err);
    console.log("failed to delete frontier");
    process.exit(1);
  }
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
