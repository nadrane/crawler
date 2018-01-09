const AWS = require("aws-sdk");
const path = require("path");

AWS.config.loadFromPath(path.join(__dirname, "..", "aws-credentials.json"));

// Since we need to hit the seed file api asynchronously (I know, total BS that we can't hit it synchronously) in prod,
// let's also wrap the dev environment in a promise to provide a common api.

module.exports = {
  SERVER_INFO: Promise.resolve({
    statServerUrl: "localhost",
    statServerPort: 8082,
    bloomFilterUrl: "127.0.0.1"
  }),
  MAX_CONCURRENCY: 10,
  SEED_FILE_PROMISE: new Promise(resolve => {
    resolve(require("APP/seed-domains-sans-subs.json"));
  }),
  FRONTIER_DIRECTORY: path.resolve(__dirname, "../frontiers"),
  DOMAIN_REQUEST_TIME_INTERVAL: 20 * 1000
};
