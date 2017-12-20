const { createWriteStream } = require("fs")
const path = require('path')
const requester = require("./requester");
const throughConcurrent = require("../through-concurrent");
const parser = require("../parser/");
const logger = require("../logger/")()

module.exports = function(concurrency, eventCoordinator) {
  return throughConcurrent('requester stream', concurrency, function(requestUrl, enc, done) {
    requester
      .crawlWithGetRequest(requestUrl)
      .then(response => {
        done();
        // In case the request failed
        if (!response) return
        const htmlStream = response.data;
        const parserStream = new parser(requestUrl, eventCoordinator)
        // TODO we want to pipe the parser stream results into a through stream that pushes
        // to the outtermost stream made by throughConcurrent above.
        parserStream.on("error", err => {
          logger.unexpectError(err, "parser stream error")
        });
        htmlStream.pipe(parserStream)
        const escapedUrl = requestUrl.split('://')[1].replace(new RegExp(/\//,'g'), '\\/')
        htmlStream.pipe(createWriteStream(path.join(__dirname, '..', '..', 'crawled-html', escapedUrl)))
      })
      .catch(err => {
        logger.unexpectedError(err, 'requester error')
        done();
      });
  });
};
