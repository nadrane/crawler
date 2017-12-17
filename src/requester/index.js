const throughConcurrent = require("through2-concurrent");
const through = require("through2");
const requester = require("./requester");
const parser = require("../parser/");

module.exports = function(concurrency) {
  return throughConcurrent.obj({ maxConcurrency: concurrency }, function(requestUrl, enc, done) {
    requester
      .crawlWithGetRequest(requestUrl)
      .then(response => {
        done();
        console.log("got response", requestUrl);
        const htmlStream = response.data;
        const parserStream = new parser(requestUrl)
        // TODO we want to pipe the parser stream results into a through stream that pushes
        // to the outtermost stream made by throughConcurrent above.
        parserStream.on("error", err => {
          console.error("parser stream error", err);
        });
        parserStream.on("finish", () => {
          console.log("parser stream finsihed");
        }); // finish event indicates the end of the write component of the transform stream
        htmlStream.pipe(parserStream).pipe(
          through.obj((url, enc, done) => {
            // console.log("pricessing link", url);
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
