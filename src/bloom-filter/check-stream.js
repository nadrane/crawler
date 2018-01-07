const throughConcurrent = require("../through-concurrent");

module.exports = function createBFCheckStream(client, logger, concurrency) {
  return throughConcurrent("bloom filter check stream", concurrency, function (url, enc, done) {
    client
      .check(url)
      .then((urlSeen) => {
        if (!urlSeen) {
          this.push(url);
        }
        done();
      })
      .catch((err) => {
        logger.unexpectedError(err, "bloom filter check stream implementation");
        done();
      });
  });
};
