const path = require('path')

module.exports = {
  userAgent: "test crawler - nicholasdrane@gmail.com",
  LOGGING_DIR: path.join(__dirname, '../logs'),
  DOMAIN_REQUEST_TIME_INTERVAL: 2 * 60 * 1000
}