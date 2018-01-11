const throughConcurrent = require("../through-concurrent");

module.exports = function createBFSetStream(client, logger, concurrency) {
  return throughConcurrent(logger, "BF set stream", concurrency, async function(url, enc, done) {
    logger.setEntered();
    try {
      await client.set(url);
    } catch (err) {
      logger.unexpectedError(err, "BF set stream");
    }
    this.push(url);
    logger.setLeft();
    done();
  });
};
