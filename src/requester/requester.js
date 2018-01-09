const { USER_AGENT } = require("APP/env");

module.exports = function makeRequester(logger, http) {
  return crawlWithGetRequest.bind(null, logger, http);
};

async function crawlWithGetRequest(logger, http, url) {
  logger.GETRequestSent(url);
  let response;
  try {
    response = await http({
      url,
      responseType: "stream",
      timeout: 5000,
      headers: {
        userAgent: USER_AGENT
      }
    });
    logger.GETResponseReceived(url, response.status);
  } catch (err) {
    return failedRequest(logger, err, url);
  }
  return response.data;
}

function failedRequest(logger, err, url) {
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
      // TODO add condition for timeouts
    } else {
      logger.noGETResponseRecieved(err, url);
    }
  } else {
    logger.unexpectedError(err, "bad request", {
      module: "get request",
      config: err.config
    });
  }
  return null;
}
