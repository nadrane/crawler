const AWS = require("aws-sdk");
const makeRequester = require("./requester");
const Parser = require("../parser/");
const sha1 = require("sha1");
const throughConcurrent = require("../through-concurrent");

AWS.config.httpOptions = { timeout: 10000 }; // attempt to resolve s3 uploads not finishing issue
const s3 = new AWS.S3();
const s3Stream = require("s3-upload-stream")(s3);

module.exports = function createRequesterStream(logger, http, eventCoordinator, concurrency) {
  const crawlWithGetRequest = makeRequester(logger, http);
  return throughConcurrent(
    logger,
    "requester stream",
    concurrency,
    async (requestUrl, enc, done) => {
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

      const parserStream = new Parser(requestUrl, eventCoordinator, logger);
      htmlStream.pipe(parserStream);

      // logger.requester.s3UploadStarted(requestUrl);
      // const upload = s3Stream.upload({
      //   Bucket: "crawler-nick",
      //   Key: `sites/${sha1(requestUrl)}`
      // });

      // htmlStream.pipe(upload);

      // const uploadFinished = new Promise((resolve, reject) => {
      //   upload.on("uploaded", () => {
      //     resolve();
      //     logger.requester.s3UploadFinished(requestUrl);
      //   });
      //   upload.on("error", err => {
      //     reject();
      //     logger.requester.s3UploadError(requestUrl, err.message);
      //   });
      // });

      const responseClosed = new Promise((resolve, reject) => {
        // the streams file descriptor should close on this event
        // stream is an instance of httpClientRequest and does not email a close event
        const tenSeconds = 10 * 1000;
        const timeoutId = setTimeout(() => {
          logger.requester.responseStreamTimeout(requestUrl);
          reject();
        }, tenSeconds);

        htmlStream.on("end", () => {
          clearTimeout(timeoutId);
          resolve();
        });
        htmlStream.on("error", () => {
          logger.requester.responseStreamError(requestUrl);
          reject();
        });
      });

      try {
        await responseClosed; // Promise.all([responseClosed, uploadFinished]);
      } catch (err) {
        console.log("final promise failed to resolve");
        console.error(err);
      }
      logger.requester.streamExited();
      done();
    }
  );
};
