const crypto = require("crypto");
const cluster = require("cluster");
const Events = require("events");
const path = require("path");
const numCPUs = require("os").cpus().length;
const childProcess = require("./child-process");
const argv = require("minimist")(process.argv.slice(2));

const eventCoordinator = new Events();
const { LOGGING_DIR, MAX_CONCURRENCY, SEED_FILE_PROMISE } = require("../../env/");

const { n, c, o } = argv; // number of machines | maximum file descriptors open | output file name
const numberOfMachines = n || 1;
const maxConcurrency = c || MAX_CONCURRENCY;
const logFile = o || path.join(LOGGING_DIR, "log.txt");
const logger = require("../logger/")(eventCoordinator, logFile);
const bloomFilter = require("../bloom-filter/bloom-filter");

if (cluster.isMaster) {
  setupBloomFilter()
    .then(() => {
      return SEED_FILE_PROMISE;
    })
    .then(seed => {
      createChildren(chunkByIndex(seed));
    });
} else {
  childProcess(maxConcurrency, eventCoordinator);
}

async function setupBloomFilter() {
  await bloomFilter.drop();
  let tries = 0;
  let success = false;
  while (tries < 5 && !success) {
    try {
      console.log("attempting BF create");
      await bloomFilter.create();
      success = true;
    } catch (err) {
      console.log("BF create failed");
      tries += 1;
    }
    await sleep(1000);
  }
  if (!success) {
    throw new Error("failed to initialize bloom filter");
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createChildren(urlChunks) {
  for (let i = 0; i < numCPUs; i++) {
    const child = cluster.fork();
    logger.spawningWorkerProcess(child.pid);
    child.send(urlChunks[i])
  }
}

function chunkByPredicate(seed, predicate) {
  const chunks = [];
  seed.forEach((url, index) => {
    if (Array.isArray(chunks[predicate(index)])) {
      chunks[predicate(index)].push(url);
    } else {
      chunks[predicate(index)] = [url];
    }
  })
  return chunks;
}

function chunkByIndex(seed) {
  return chunkByPredicate(seed, index => index % numCPUs)
}
