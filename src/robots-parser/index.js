const makeRobotParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");

module.exports = function createRobotsStream(logger, http, concurrency) {
  const isAllowed = makeRobotParser(logger, http);
  return throughConcurrent(logger, "robots stream", concurrency, async function(url, enc, done) {
    try {
      if (await isAllowed(url, http)) {
        this.push(url);
      }
    } catch (err) {
      logger.unexpectedError(err, "robots stream failure");
    }
    done();
  });
};
