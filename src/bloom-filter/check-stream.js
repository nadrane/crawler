const throughConcurrent = require("../through-concurrent");
const logger = require("../logger/")();
const bloomFilter = require("./bloom-filter");

module.exports = function(concurrency) {
  return throughConcurrent("bloom filter check stream", concurrency, function(url, enc, done) {
    bloomFilter
      .check(url)
      .then(urlSeen => {
        if (!urlSeen) {
          this.push(url);
        }
        done();
      })
      .catch(err => {
        logger.unexpectedError(err, "failed at bloom filter check stream implementation");
      });
  });
};
