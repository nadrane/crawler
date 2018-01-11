const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  httpOptions: {
    xhrAsync: false
  }
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
  SERVER_INFO: serverInfo,
  SEED_FILE_PROMISE: seedFilePromise,
  FRONTIER_DIRECTORY: "/frontiers" // volume mounted in Docker
};
