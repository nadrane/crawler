const bluebird = require("bluebird");
const bloomd = require("bloomd");

client = bloomd.createClient();
const logger = require("../logger/")();
const { BLOOM_FILTER_NAME } = require("APP/env/");

client.on("error", (err) => {
  logger.unexpectedError(err, "bloom filter");
});

const set = function (key) {
  return new Promise((resolve, reject) => {
    client.set(BLOOM_FILTER_NAME, key, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

const check = function (key) {
  return new Promise((resolve, reject) => {
    client.check(BLOOM_FILTER_NAME, key, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

const create = function () {
  return new Promise((resolve, reject) => {
    client.create(BLOOM_FILTER_NAME, {}, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

module.exports = {
  set,
  check,
  create,
};
