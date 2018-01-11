const throughConcurrent = require("../through-concurrent");

module.exports = function createBFCheckStream(client, logger, concurrency) {
  return throughConcurrent(logger, "BF check stream", concurrency, async function(url, enc, done) {
    logger.checkEntered();
    let urlHasBeenVisied;
    try {
      urlHasBeenVisied = await client.check(url);
    } catch (err) {
      logger.unexpectedError(err, "BF check stream");
    }
    if (!urlHasBeenVisied) {
      this.push(url);
    }
    logger.checkLeft();
    done();
  });
};
