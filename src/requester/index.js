const AWS = require("aws-sdk");
const makeRequester = require("./requester");
const Parser = require("../parser/");
const sha1 = require("sha1");
const throughConcurrent = require("../through-concurrent");

const s3 = new AWS.S3();
const s3Stream = require("s3-upload-stream")(s3);

module.exports = function createRequesterStream(logger, http, eventCoordinator, concurrency) {
  const crawlWithGetRequest = makeRequester(logger, http);
  return throughConcurrent(logger, "requester stream", concurrency, async (requestUrl, enc, done) => {
    logger.requester.streamEntered();
    let htmlStream;
    try {
      htmlStream = await crawlWithGetRequest(requestUrl);
    } catch (err) {
      logger.requester.unexpectError(err, "requester stream failure");
    }
    // In case the request failed
    if (!htmlStream) {
      logger.requester.streamExited();
      done();
      return;
    }

    const responseClosed = new Promise(resolve => {
      // the streams file descriptor should close on this event
      // stream is an instance of httpClientRequest and does not email a close event
      htmlStream.on("end", () => {
        resolve();
      });
    });

    const parserStream = new Parser(requestUrl, eventCoordinator, logger);
    htmlStream.pipe(parserStream);

    logger.requester.s3UploadStarted(requestUrl);
    const upload = s3Stream.upload({
      Bucket: "crawler-nick",
      Key: `sites/${sha1(requestUrl)}`
    });

    htmlStream.pipe(upload);
    const uploadFinished = new Promise((resolve, reject) => {
      upload.on("uploaded", () => {
        resolve();
        logger.requester.s3UploadFinished(requestUrl);
      });
      upload.on("error", err => {
        reject();
        logger.requester.unexpectError(err, "s3 stream error");
      });
    });
    Promise.all([responseClosed, uploadFinished])
      .then(() => {
        logger.requester.streamExited();
        done();
      })
      .catch(() => {
        logger.requester.streamExited();
        done();
      });
  });
};
