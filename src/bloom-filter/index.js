module.exports = function(logger, host, concurrency) {
  const client = require("./client/")(host);
  const checkStream = require("./check-stream")(client, concurrency);
  const setStream = require("./set-stream")(client, concurrency);
  module.exports = {
    client,
    checkStream,
    setStream
  };
};
