const throughConcurrent = require("through2-concurrent");
const logger = require("../logger/")();

module.exports = function createThroughConcurrent(name, concurrency, callback) {
  const stream = throughConcurrent.obj({ maxConcurrency: concurrency }, callback);
  stream.on("error", (err) => {
    logger.unexpectedError(err, name);
  });
  return stream;
};
