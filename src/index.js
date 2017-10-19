var argv = require("minimist")(process.argv.slice(2));
const logger = require('./logger');

const { c, o } = argv;
const Crawler = require("./crawler");


logger.rotateLog(c)
let currentCrawler = new Crawler(c)

currentCrawler.start();
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
  logger.unexpectedError(err);
});
