const { promisify } = require("util");
const { readFile } = require("fs");
const path = require("path");

const statsServers = require("../stats-server-credentials.json");

// Since we need to hit the s3 api asynchronously (I know, total BS that we can't hit it synchronously) in prod,
// let's also wrap the dev environment in a promise to provide a common api.

module.exports = {
  STATS_SERVER_IP: Promise.resolve(statsServers.ipAddress),
  SEED_FILE_PROMISE: new Promise((resolve, reject) => {
    resolve(require("APP/seed-domains-sans-subs.json"))
  }),
  FRONTIER_DIRECTORY: path.resolve(__dirname, "../frontiers"),
  DOMAIN_REQUEST_TIME_INTERVAL: 20 * 1000,
};
