const axios = require("axios");
const makeRobotParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");
const logger = require("../logger/")();

const isAllowed = makeRobotParser();

module.exports = function createRobotsStream(concurrency) {
  return throughConcurrent("robots stream", concurrency, async function getRobotsTxt(url, enc, done) {
    try {
      if (await isAllowed(url, axios)) {
        this.push(url);
      }
    } catch (err) {
      logger.unexpectedError(err, "robots stream");
    }
    done();
  });
};
