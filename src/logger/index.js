const loggerCreator = require('./core-logger')
const bunyanFactory = require('./buyan-adaptor')

let logger
module.exports = function(outputFile) {
  if (!logger) {
    logger = loggerCreator(bunyanFactory, outputFile)
  }
  return logger
}