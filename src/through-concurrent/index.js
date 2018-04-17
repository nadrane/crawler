const throughConcurrent = require("through2-concurrent");

module.exports = function createThroughConcurrent(logger, name, concurrency, callback) {
  const stream = throughConcurrent.obj({ maxConcurrency: concurrency }, function(
    domain,
    enc,
    done
  ) {
    setImmediate(() => {
      callback.call(this, domain, enc, done);
    });
  });
  stream.on("error", err => {
    logger.unexpectedError(err, name);
  });
  return stream;
};
