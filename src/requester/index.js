const throughConcurrent = require("through2-concurrent");
const through2 = require("through2");
const requester = require('./requester')
const parser = require('../parser/')

module.exports = function(concurrency) {
  return throughConcurrent.obj({ maxConcurrency: concurrency }, function(requestUrl, enc, done) {
    requester.crawlWithGetRequest(requestUrl)
      .then(response => {
        const htmlStream = response.data
        const parserStream = new parser(requestUrl)
        // TODO we want to pipe the parser stream results into a through stream that pushes
        // to the outtermost stream made by throughConcurrent above.
        parserStream.on('finish', () => done())  // finish event indicates the end of the write component of the transform stream
        htmlStream.pipe(parserStream)
      })
      .catch(err => {
        this.on("error", err);
      });
  });
};
