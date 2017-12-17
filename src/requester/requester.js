const logger = require("../logger/")();
const axios = require("axios");
const { USER_AGENT } = require("APP/env");

class Requester {
  async crawlWithGetRequest(url) {
    logger.GETRequestSent(url, this.totalRequestsMade);
    let response
    try {
      response = axios({
        method: "get",
        url,
        responseType: "stream",
        headers: {
          userAgent: USER_AGENT
        }
      });
      logger.GETResponseReceived(url, response.status);
      //TODO emit finished event. store url in bloom filter
      // Note we could easily hit the same url twice since we are choosing to keep
      // no record of urls currently being processed, though this is SUPER unlikely (if not impossible)
      // becuase of domain throttling
    } catch (err) {
      this._failedRequest(err);
    }
    return response
  }

  _failedRequest(err) {
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
        const { domain } = parse(url);
        logger.connectionReset(url);
      } else {
        logger.noGETResponseRecieved(err, url);
      }
    } else {
      logger.unexpectedError(err, "bad request", {
        module: "get request",
        config: err.config
      });
    }
  }
}

module.exports = new Requester();
