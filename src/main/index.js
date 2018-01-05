const cluster = require("cluster");
const path = require("path");
const numCPUs = require("os").cpus().length;
const childProcess = require("./child-process");

const argv = require("minimist")(process.argv.slice(2));
const { LOGGING_DIR, MAX_CONCURRENCY, SEED_FILE_PROMISE } = require("../../env/");

const { c, o } = argv; // maximum file descriptors open | output file name
const maxConcurrency = c || MAX_CONCURRENCY;
const logFile = o || path.join(LOGGING_DIR, "log.txt");
const logger = require("../logger/")(logFile);
const bloomFilter = require("../bloom-filter/bloom-filter");

if (cluster.isMaster) {
  setupBloomFilter().then(() => {
    createChildren();
  });
} else {
  childProcess(maxConcurrency, logFile);
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

function createChildren() {
  for (let i = 0; i < numCPUs; i++) {
    const child = cluster.fork();
    logger.spawningWorkerProcess(child.pid);

    SEED_FILE_PROMISE.then(data => {
      const delimitedData = data.toString().split("\n");
      const { length } = delimitedData;
      const chunkSize = Math.ceil(length / numCPUs);
      child.send(delimitedData.slice(i * chunkSize, (i + 1) * chunkSize));
    });
  }
}
