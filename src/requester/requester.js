const logger = require("../logger/")();
const axios = require("axios");
const { parse } = require("tldjs");
const { USER_AGENT } = require("APP/env");

const Requester = {
  async crawlWithGetRequest(url) {
    logger.GETRequestSent(url, this.totalRequestsMade);
    let response;
    try {
      response = await axios({
        method: "get",
        url,
        responseType: "stream",
        headers: {
          userAgent: USER_AGENT,
        },
      });
      logger.GETResponseReceived(url, response.status);
    } catch (err) {
      failedRequest(err, url);
      return null;
    }
    return response;
  },
};

function failedRequest(err, url) {
  // The request was made and the server responded with a status code
  // that falls out of the range of 2xx
  if (err.response) {
    const { headers, status } = err.response;
    logger.GETResponseError(url, err, status, headers);
    // No response received
  } else if (err.request) {
    // do not retry if connection reset
    // simply limiting complexity here
    if (err.code === "ECONNRESET") {
      logger.connectionReset(url);
    } else {
      logger.noGETResponseRecieved(err, url);
    }
  } else {
    logger.unexpectedError(err, "bad request", {
      module: "get request",
      config: err.config,
    });
  }
}

module.exports = Requester;
