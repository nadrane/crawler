module.exports = function makeBloomFilterStreams(
  logger,
  { host = "127.0.0.1", name = `crawler_${process.pid}`, concurrency = 10 }
) {
  const client = require("./client/")(logger, { host, name });
  const checkStream = require("./check-stream")(client, logger, concurrency);
  const setStream = require("./set-stream")(client, logger, concurrency);
  return {
    initialize: client.initializeBloomFilter.bind(client),
    checkStream,
    setStream
  };
};
