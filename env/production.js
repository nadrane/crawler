const AWS = require("aws-sdk");
const axios = require("axios");

const s3 = new AWS.S3({
  httpOptions: {
    xhrAsync: false
  }
});

const machineIndex = axios
  .get("http://169.254.169.254/latest/meta-data/ami-launch-index")
  .then(res => res.data)
  .catch(err => {
    throw err;
  });

const serverInfo = new Promise((resolve, reject) => {
  s3.getObject(
    {
      Bucket: "crawler-nick",
      Key: "server-info.json"
    },
    (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data.Body.toString()));
    }
  );
});

const seedFilePromise = new Promise((resolve, reject) => {
  s3.getObject(
    {
      Bucket: "crawler-nick",
      Key: "seed.json"
    },
    (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data.Body));
    }
  );
});

module.exports = {
  // TODO change to prod token
  ROBOTS_CACHE_SIZE: 40000,
  MAX_CONCURRENCY: 30,
  MACHINE_INDEX: machineIndex,
  SERVER_INFO: serverInfo,
  SEED_FILE_PROMISE: seedFilePromise,
  FRONTIER_DIRECTORY: "/frontiers", // volume mounted in Docker,
  LOG_STREAM_BUFFER_SIZE: 5000
};
