const throughConcurrent = require("../through-concurrent");

module.exports = function createBFCheckStream(client, logger, concurrency) {
  return throughConcurrent(logger, "check stream", concurrency, async function(url, enc, done) {
    logger.bloomFilter.checkStreamEntered();
    let urlHasBeenVisied;
    try {
      urlHasBeenVisied = await client.check(url);
    } catch (err) {
      logger.bloomFilter.unexpectedError(err, "check stream");
    }
    if (!urlHasBeenVisied) {
      this.push(url);
      logger.bloomFilter.newLink();
    } else {
      logger.bloomFilter.visitedLink();
    }
    done();
  });
};
