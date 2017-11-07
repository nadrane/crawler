const { promisify } = require('util')
const { readFile } = require('fs');
const readFileAsync = promisify(readFile)

// Since we need to hit the s3 api asynchronously (I know, total BS that we can't hit it synchronously) in prod,
// let's also wrap the dev environment in a promise to provide a common api.

module.exports = {
  LOGENTRIES_TOKEN_PROMISE: Promise.resolve(require("../logentries-credentials").DEV_TOKEN),
  SEED_FILE_PROMISE: readFileAsync('./seed-domains.txt'),
  FRONTIER_DIRECTORY: "./frontiers"
};
