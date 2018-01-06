const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  httpOptions: {
    xhrAsync: false
  }
});

const statsServerIp = new Promise((resolve, reject) => {
  s3.getObject(
    {
      Bucket: "crawler-nick",
      Key: "stats-server-credentials.json"
    },
    (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data.Body.toString()).IP_ADDRESS);
    }
  );
});
statsServerIp.then(data => {
  console.log('server data', JSON.parse(data.Body.toString()));
});

const seedFilePromise = new Promise((resolve, reject) => {
  s3.getObject(
    {
      Bucket: "crawler-nick",
      Key: "seed-domains.txt"
    },
    (err, data) => {
      if (err) reject(err);
      else resolve(data.Body);
    }
  );
});

module.exports = {
  // TODO change to prod token
  STATS_SERVER_IP: statsServerIp,
  SEED_FILE_PROMISE: seedFilePromise,
  FRONTIER_DIRECTORY: "/frontiers" // volume mounted in Docker
};
