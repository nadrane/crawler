const throughConcurrent = require("through2-concurrent");
const logger = require("../logger/")();
const bloomFilter = require("./bloomFilter");

module.exports = function(concurrency) {
  return throughConcurrent.obj({ maxConcurrency: concurrency }, function(url, enc, done) {
    bloomFilter
      .check(url)
      .then(urlSeen => {
        if (!urlSeen) {
          this.push(url);
        }
        done();
      })
      .catch(err => {
        logger.unexpectedError(err, "failed at bloom filter stream implementation");
      });
  });
};
