const throughConcurrent = require("../through-concurrent");

module.exports = function createBFSetStream(client, logger, concurrency) {
  return throughConcurrent("BF set stream", concurrency, async function(url, enc, done) {
    try {
      await client.set(url);
    } catch (err) {
      logger.unexpectedError(err, "BF set stream");
    }
    this.push(url);
    done()
  });
};
