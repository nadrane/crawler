const throughConcurrent = require("through2-concurrent");
const through = require("through2");
const requester = require("./requester");
const parser = require("../parser/");
const logger = require("../logger/")()

module.exports = function(concurrency) {
  return throughConcurrent.obj({ maxConcurrency: concurrency }, function(requestUrl, enc, done) {
    requester
      .crawlWithGetRequest(requestUrl)
      .then(response => {
        done();
        const htmlStream = response.data;
        const parserStream = new parser(requestUrl)
        // TODO we want to pipe the parser stream results into a through stream that pushes
        // to the outtermost stream made by throughConcurrent above.
        parserStream.on("error", err => {
          logger.unexpectError(err, "parser stream error")
        });
        parserStream.on("finish", () => {
          console.log("parser stream finsihed");
        }); // finish event indicates the end of the write component of the transform stream
        htmlStream.pipe(parserStream).pipe(
          through.obj((url, enc, done) => {
            this.push(url);
            done();
          })
        );
      })
      .catch(err => {
        console.log("requester error", err);
        done();
      });
  });
};
