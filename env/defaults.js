const path = require("path");

module.exports = {
  USER_AGENT: "test crawler - nickdrane.com/crawler",
  LOGGING_DIR: path.join(__dirname, "../logs"),
  DOMAIN_REQUEST_TIME_INTERVAL: 2 * 60 * 1000,
  MAX_CONCURRENCY: 10,
  BLOOM_FILTER_NAME: "crawler",
  MACHINE_INDEX: Promise.resolve(0),
  ROBOTS_CACHE_SIZE: 1000,
  LOG_STREAM_BUFFER_SIZE: 5000,
  GET_REQUEST_TIMEOUT: 1500,
  ROBOTS_REQUEST_TIMEOUT: 1500
};
