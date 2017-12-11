const robotsParser = require("./robots-parser");
const through2 = require("through2-concurrent");

module.exports = function(concurrency) {
  return through2.obj({ maxConcurrency: concurrency }, function(url, enc, done) {
    robotsParser(url)
      .then(allowed => {
        this.push(url);
        done();
      })
      .catch(err => {
        this.on("error", err);
      });
  });
};
