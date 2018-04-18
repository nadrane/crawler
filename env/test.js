const path = require("path");

module.exports = {
  FRONTIER_DIRECTORY: path.resolve(__dirname, "../test-frontiers"),
  LOGGING_DIR: path.resolve(__dirname, "../test-logs"),
  DOMAIN_REQUEST_TIME_INTERVAL: 10,
  APPEND_FLUSH_TIME: 60 * 1000
};
