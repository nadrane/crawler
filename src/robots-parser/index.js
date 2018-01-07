const makeRobotParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");

const isAllowed = makeRobotParser();

module.exports = function createRobotsStream(logger, http, concurrency) {
  return throughConcurrent("robots stream", concurrency, async function(url, enc, done) {
    if (await isAllowed(url, http)) {
      this.push(url);
    }
    done();
  });
};
