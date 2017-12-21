const throughConcurrent = require("../through-concurrent");
const logger = require("../logger/")();
const bloomFilter = require("./bloom-filter");

module.exports = function createBFCheckStream(concurrency) {
  return throughConcurrent("bloom filter check stream", concurrency, function BFCheck(url, enc, done) {
    bloomFilter
      .check(url)
      .then((urlSeen) => {
        if (!urlSeen) {
          this.push(url);
        }
        done();
      })
      .catch((err) => {
        logger.unexpectedError(err, "bloom filter check stream implementation");
      });
  });
};
