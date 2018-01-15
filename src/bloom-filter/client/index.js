const bloomd = require("bloomd");
const { BLOOM_FILTER_NAME } = require("APP/env/");

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

  const initializeBloomFilter = async function() {
    await drop();
    let tries = 0;
    let success = false;
    while (tries < 5 && !success) {
      try {
        console.log("attempting BF create");
        success = await create();
      } catch (err) {
        console.log("BF create failed");
        tries += 1;
      }
      await sleep(1000);
    }
    if (!success) {
      throw new Error("failed to initialize bloom filter");
    } else {
      console.log("BF created");
    }
  };

  return {
    set,
    check,
    create,
    drop,
    initializeBloomFilter
  };
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
