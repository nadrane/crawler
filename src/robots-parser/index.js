const robotsParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");

module.exports = function createRobotsStream(concurrency) {
  return throughConcurrent("robots stream", concurrency, function getRobotsTxt(url, enc, done) {
    robotsParser(url)
      .then((allowed) => {
        if (allowed) {
          this.push(url);
        }
        done();
      })
      .catch((err) => {
        this.on("error", err);
      });
  });
};
