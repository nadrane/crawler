const { getDomain } = require("tldjs");

const codeModule = "requester";

module.exports = logger => {
  return {
    streamEntered: () => {
      logger.debug({
        event: "stream entered",
        codeModule
      });
    },

    streamExited: () => {
      logger.debug({
        event: "stream left",
        codeModule
      });
    },

    badRequest: (url, config) => {
      const domain = getDomain(url);
      logger.error({
        event: "bad request",
        codeModule,
        url,
        domain,
        config
      });
    },

    requestSent: url => {
      const domain = getDomain(url);
      logger.info({
        event: "request sent",
        codeModule,
        url,
        domain
      });
    },

    responseReceived: (url, statusCode) => {
      const domain = getDomain(url);
      logger.info({
        event: "response success",
        codeModule,
        statusCode,
        url,
        domain
      });
    },

    responseError: (url, err, status, headers) => {
      const domain = getDomain(url);
      logger.info({
        event: "response error",
        codeModule,
        status,
        headers,
        err: err.message,
        url,
        domain
      });
    },

    noResponseRecieved: (err, url) => {
      const domain = getDomain(url);
      logger.info({
        err,
        event: "no response received",
        codeModule,
        url,
        domain
      });
    },

    requestTimeout: url => {
      const domain = getDomain(url);
      logger.info({
        event: "response timeout",
        codeModule,
        url,
        domain
      });
    },

    connectionReset: url => {
      const domain = getDomain(url);
      logger.info({
        event: "connection reset",
        codeModule,
        url,
        domain
      });
    },

    s3UploadStarted: url => {
      const domain = getDomain(url);
      logger.info({
        event: "s3 upload started",
        domain,
        codeModule
      });
    },

    s3UploadFinished: url => {
      const domain = getDomain(url);
      logger.info({
        event: "s3 upload finished",
        domain,
        codeModule
      });
    }
  };
};
