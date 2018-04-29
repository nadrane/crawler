const axios = require("axios");
const { MAX_CONTENT_LENGTH } = require("../env");

function responseTimeTrackingHttp(logger, codeModule) {
  const trackingHttp = axios.create();
  trackingHttp.interceptors.request.use(config => Object.assign({ startTime: Date.now() }, config));

  trackingHttp.interceptors.response.use(response => {
    const { startTime } = response.config;
    const responseDuration = Date.now() - startTime;
    logger[codeModule].trackResponseTime(response.url, responseDuration);
    return response;
  });
  return trackingHttp;
}

module.exports = function(logger, { codeModule, maxContentLength = MAX_CONTENT_LENGTH }) {
  const http = responseTimeTrackingHttp(logger, codeModule);
  const lengthCountingHttp = async function(...args) {
    const { data: responseStream } = await http(...args);

    let currentBodyLength = 0;
    responseStream.on("data", data => {
      currentBodyLength += data.length;
      if (maxContentLength && currentBodyLength > maxContentLength) {
        const error = new Error(`maximum body length of ${maxContentLength} exceeded`);
        error.bytesDownloads = currentBodyLength;
        responseStream.emit("error", error);
      }
    });
    responseStream.on("end", data => {
      if (data) {
        currentBodyLength += data.length;
      }
      responseStream.emit("size", currentBodyLength);
    });

    return responseStream;
  };
  return lengthCountingHttp;
};
