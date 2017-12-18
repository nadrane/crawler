const robotsParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");

module.exports = function(concurrency) {
  return throughConcurrent("robots stream", concurrency, function(url, enc, done) {
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
