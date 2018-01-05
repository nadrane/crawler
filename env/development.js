const { promisify } = require("util");
const { readFile } = require("fs");
const path = require("path");

const readFileAsync = promisify(readFile);
const { DEV_TOKEN } = require("../logentries-credentials");

// Since we need to hit the s3 api asynchronously (I know, total BS that we can't hit it synchronously) in prod,
// let's also wrap the dev environment in a promise to provide a common api.

module.exports = {
  LOGENTRIES_TOKEN_PROMISE: Promise.resolve(DEV_TOKEN),
  SEED_FILE_PROMISE: new Promise((resolve, reject) => {
    resolve(require("APP/seed-domains-sans-subs.json"))
  }),
  FRONTIER_DIRECTORY: path.resolve(__dirname, "../frontiers"),
  DOMAIN_REQUEST_TIME_INTERVAL: 20 * 1000,
};
