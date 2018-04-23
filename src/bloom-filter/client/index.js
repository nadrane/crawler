const bloomd = require("bloomd");

module.exports = function(logger, { host, name }) {
  const client = bloomd.createClient({ host, maxConnectionAttempts: 10 });
  client.on("error", err => {
    logger.unexpectedError(err, "bloom filter");
  });

  const set = function(key) {
    return new Promise((resolve, reject) => {
      client.set(name, key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const check = function(key) {
    return new Promise((resolve, reject) => {
      client.check(name, key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const create = function() {
    return new Promise((resolve, reject) => {
      client.create(name, {}, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const drop = function() {
    return new Promise((resolve, reject) => {
      client.drop(name, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };

  const initializeBloomFilter = async function() {
    console.log("name", name);
    try {
      console.log("dropping bf");
      await drop(name);
    } catch (err) {
      console.log("failed to drop existing bloom filter. Connection likely failed. Make sure your bloom filter is running");
      console.error(err);
      throw err;
    }
    let tries = 0;
    let success = false;
    while (tries < 5 && !success) {
      try {
        console.log("attempting BF create");
        success = await create(name);
      } catch (err) {
        console.log("BF create failed");
        tries += 1;
      }
      await sleep(1000);
    }
    if (!success) {
      throw new Error("failed to initialize bloom filter. Make sure your bloom filter is running");
    } else {
      console.log("BF created");
    }
  };

  return {
    set,
    check,
    initializeBloomFilter
  };
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
