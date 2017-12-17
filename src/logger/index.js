const loggerCreator = require("./core-logger");
const bunyanFactory = require("./buyan-adaptor");

logger = loggerCreator(bunyanFactory, outputFile);
module.exports = logger;
