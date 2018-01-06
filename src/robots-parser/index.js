const axios = require("axios");
const makeRobotParser = require("./robots-parser");
const throughConcurrent = require("../through-concurrent");

const isAllowed = makeRobotParser();

module.exports = function createRobotsStream(concurrency) {
  return throughConcurrent("robots stream", concurrency, function getRobotsTxt(url, enc, done) {
    isAllowed(url, axios).then(allowed => {
      if (allowed) {
        this.push(url);
      }
      done();
    });
  });
};
