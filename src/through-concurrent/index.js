const throughConcurrent = require("through2-concurrent");
const logger = require("../logger/")();
let i = 0
module.exports = function createThroughConcurrent(name, concurrency, callback) {
  const stream = throughConcurrent.obj({ maxConcurrency: concurrency }, function(url, enc, done) {
    if (i > 50 ) {
      console.log(`${process.pid} entering`, name)
      i = 0
    }
    callback.call(this, url, enc, done)
    if (i > 50){
      console.log(`${process.pid} exiting`, name)
      i = 0
    }
    i++
  });
  stream.on("error", err => {
    console.error('there is an error', err, err.stack, err.message)
    logger.unexpectedError(err, name);
  });
  return stream;
};
