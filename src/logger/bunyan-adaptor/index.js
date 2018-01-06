const bunyanFactory = require("./adaptor");
const LogStream = require("./log-stream");

module.exports = function bunyanWithHttpStream(url, http) {
  const logStream = new LogStream(url, http);
  return bunyanFactory(logStream);
};
