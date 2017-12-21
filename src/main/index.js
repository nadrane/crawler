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

// function broadcast({ event, message, pid }) {
//   cluster.workers.forEach(id => {
//     if (pid === id) return;
//     cluster.workers[id].send({ event, message });
//   });
// }

// function configureMaster() {
//   process.on("message", ({ event, message, pid }) => {
//     broadcast({ event, message, pid });
//   });
// }

if (cluster.isMaster) {
  // configureMaster();
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
} else {
  childProcess(maxConcurrency, logFile);
}
