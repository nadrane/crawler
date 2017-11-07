var argv = require("minimist")(process.argv.slice(2));
const logger = require('./logger');

const { c, f } = argv;
const Crawler = require("./crawler");

let currentCrawler = new Crawler(c, f)

currentCrawler.seedDomainsAndStart();
// newCrawlerIn60()

// function newCrawlerIn60() {
//   setTimeout(function() {
//     console.log(`trying ${max} connections`)
//     currentCrawler.stop()
//     max += 10
//     if (max > 200) return
//     logger.rotateLog(max)
//     currentCrawler = new Crawler(max)
//     newCrawlerIn60()
//   }, 1000)
// }

process.on("uncaughtException", function(err) {
  logger.unexpectedError(err, "uncaught exception");
});

process.on('unhandledRejection', (reason, p) => {
  logger.unexpectedError(reason, "unhandled promise rejection", p);
});