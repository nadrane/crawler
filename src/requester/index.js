const path = require("path");
const requester = require("./requester");
const throughConcurrent = require("../through-concurrent");
const Parser = require("../parser/");
const logger = require("../logger/")();
const sha1 = require("sha1");
const AWS = require("aws-sdk");

AWS.config.loadFromPath(path.join(__dirname, "..", "..", "aws-credentials.json"));
const s3 = new AWS.S3();
const s3Stream = require("s3-upload-stream")(s3);

module.exports = function createRequesterStream(concurrency, eventCoordinator) {
  return throughConcurrent("requester stream", concurrency, (requestUrl, enc, done) => {
    requester
      .crawlWithGetRequest(requestUrl)
      .then(response => {
        // In case the request failed
        if (!response) return;

        const htmlStream = response.data;
        const responseClosed = new Promise(resolve => {
          // the streams file descriptor should close on this event
          // stream is an instance of httpClientRequest and does not email a close event
          htmlStream.on("end", () => {
            resolve();
          });
        });

        const parserStream = new Parser(requestUrl, eventCoordinator);
        htmlStream.pipe(parserStream);

        const upload = s3Stream.upload({
          Bucket: "crawler-nick",
          Key: `sites/${sha1(requestUrl)}`
        });
        htmlStream.pipe(upload);
        const uploadFinished = new Promise(resolve => {
          upload.on("uploaded", () => {
            resolve();
          });
        });
        Promise.all([responseClosed, uploadFinished]).then(() => {
          done();
        });
      })
      .catch(err => {
        logger.unexpectedError(err, "requester error");
        done();
      });
  });
};
