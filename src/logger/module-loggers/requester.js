const { parse } = require("tldjs");

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
      const { domain, subdomain } = parse(url);
      logger.error({
        event: "bad request",
        codeModule,
        url,
        domain,
        subdomain,
        config
      });
    },

    requestSent: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "request sent",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    responseReceived: (url, statusCode) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "response success",
        codeModule,
        statusCode,
        url,
        domain,
        subdomain
      });
    },

    responseError: (url, errMessage, status, headers) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "response error",
        codeModule,
        status,
        headers,
        errMessage,
        url,
        domain,
        subdomain
      });
    },

    noResponseRecieved: (errMessage, url) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        errMessage,
        event: "no response received",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    requestTimeout: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "response timeout",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    connectionReset: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "connection reset",
        codeModule,
        url,
        domain,
        subdomain
      });
    },

    s3UploadStarted: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "s3 upload started",
        codeModule,
        domain,
        subdomain
      });
    },

    s3UploadFinished: url => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "s3 upload finished",
        codeModule,
        domain,
        subdomain
      });
    },

    s3UploadError: (url, message) => {
      const { domain, subdomain } = parse(url);
      logger.error({
        event: "s3 upload error",
        codeModule,
        url,
        domain,
        subdomain,
        message
      });
    },

    trackResponseTime: (url, responseTime) => {
      const { domain, subdomain } = parse(url);
      logger.info({
        event: "track response time",
        codeModule,
        url,
        domain,
        subdomain,
        responseTime
      });
    }
  };
};
