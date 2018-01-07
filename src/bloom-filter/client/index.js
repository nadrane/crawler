const bloomd = require("bloomd");
const { BLOOM_FILTER_NAME } = require("../../env/");

module.exports = function(logger, host) {
  const client = bloomd.createClient({ host });
  client.on("error", err => {
    logger.unexpectedError(err, "bloom filter");
  });

  const set = function(key) {
    return new Promise((resolve, reject) => {
      client.set(BLOOM_FILTER_NAME, key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const check = function(key) {
    return new Promise((resolve, reject) => {
      client.check(BLOOM_FILTER_NAME, key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const create = function() {
    return new Promise((resolve, reject) => {
      client.create(BLOOM_FILTER_NAME, {}, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const drop = function() {
    return new Promise((resolve, reject) => {
      client.drop(BLOOM_FILTER_NAME, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  return {
    set,
    check,
    create,
    drop
  };
};
