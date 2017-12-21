const { createWriteStream } = require("fs");
const path = require("path");
const requester = require("./requester");
const throughConcurrent = require("../through-concurrent");
const Parser = require("../parser/");
const logger = require("../logger/")();
const sha1 = require("sha1");

module.exports = function createRequesterStream(concurrency, eventCoordinator) {
  return throughConcurrent("requester stream", concurrency, (requestUrl, enc, done) => {
    requester
      .crawlWithGetRequest(requestUrl)
      .then((response) => {
        done();
        // In case the request failed
        if (!response) return;
        const htmlStream = response.data;
        const parserStream = new Parser(requestUrl, eventCoordinator);
        // TODO we want to pipe the parser stream results into a through stream that pushes
        // to the outtermost stream made by throughConcurrent above.
        parserStream.on("error", (err) => {
          logger.unexpectError(err, "parser stream error");
        });
        htmlStream.pipe(parserStream);
        htmlStream.pipe(createWriteStream(path.join(__dirname, "..", "..", "crawled-html", sha1(requestUrl))));
      })
      .catch((err) => {
        logger.unexpectedError(err, "requester error");
        done();
      });
  });
};
