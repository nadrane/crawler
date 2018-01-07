const throughConcurrent = require("../through-concurrent");

module.exports = function createBFSetStream(client, logger, concurrency) {
  return throughConcurrent("bloom filter set stream", concurrency, function (url, enc, done) {
    client
      .set(url)
      .then(() => {
        this.push(url);
        done();
      })
      .catch(err => {
        logger.unexpectedError(err, "bloom filter set stream implementation");
        done();
      });
  });
};
