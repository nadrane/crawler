const throughConcurrent = require("../through-concurrent");
const logger = require("../logger/")();
const bloomFilter = require("./bloom-filter");

module.exports = function(concurrency) {
  return throughConcurrent("bloom filter set stream", concurrency, function(url, enc, done) {
    bloomFilter
      .set(url)
      //TODO currently we do nothing if the set fails
      .then(_ => {
        this.push(url);
        done();
      })
      .catch(err => {
        logger.unexpectedError(err, "bloom filter set stream implementation");
      });
  });
};
