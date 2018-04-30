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
  ROBOTS_REQUEST_TIMEOUT: 1500,
  APPEND_FLUSH_TIME: 2000, // Not possible to set this below 2000 milliseconds
  MAX_CONTENT_LENGTH: 1 * 1000 * 1000, // max body length of 1 million bytes (~1mb)
  DNS_CACHE_SIZE: 20000,
  DOMAIN_READ_DELAY: 50
};
