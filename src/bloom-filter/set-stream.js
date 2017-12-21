const throughConcurrent = require("../through-concurrent");
const logger = require("../logger/")();
const bloomFilter = require("./bloom-filter");

module.exports = function createBFSetStream(concurrency) {
  return throughConcurrent("bloom filter set stream", concurrency, function BFSet(url, enc, done) {
    bloomFilter
      .set(url)
      // TODO currently we do nothing if the set fails
      .then(() => {
        this.push(url);
        done();
      })
      .catch((err) => {
        logger.unexpectedError(err, "bloom filter set stream implementation");
      });
  });
};
