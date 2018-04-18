const throughConcurrent = require("../through-concurrent");

module.exports = function createBFSetStream(client, logger, concurrency) {
  return throughConcurrent(logger, "set stream", concurrency, async function(url, enc, done) {
    logger.bloomFilter.setStreamEntered();
    try {
      logger.bloomFilter.markingAsSeen(url);
      await client.set(url);
    } catch (err) {
      logger.bloomFilter.unexpectedError(err, "set stream");
    }
    this.push(url);
    logger.bloomFilter.setStreamExited();
    done();
  });
};
