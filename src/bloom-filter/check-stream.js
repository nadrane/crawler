const throughConcurrent = require("../through-concurrent");

module.exports = function createBFCheckStream(client, logger, concurrency) {
  return throughConcurrent("BF check stream", concurrency, async function(url, enc, done) {
    let urlHasBeenVisied;
    try {
      urlHasBeenVisied = await client.check(url);
    } catch (err) {
      logger.unexpectedError(err, "BF check stream");
    }
    if (!urlHasBeenVisied) {
      this.push(url);
    }
    done();
  });
};
