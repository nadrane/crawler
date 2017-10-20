const robotsParser = require("robots-parser");
const logger = require("./logger");
const axios = require("axios");
const { userAgent } = require("../env/");
const { URL } = require("url");

const cache = {};

//IDEA garbage collection of robots cache
//Maybe an LRU cache? Or eliminate if a domains frontier is empty for too long?
async function isAllowed(url) {
  // A given robotsTxt file is valid for a given hostname, protocol, port combination (https://developers.google.com/search/reference/robots_txt)
  // A robotsTxt file is not valid in subdomains of its url.
  // We want to cache robotsTxt results to avoid making an extra network request for every page.
  const parsedUrl = new URL(url);
  const { protocol, hostname } = parsedUrl;
  let { port } = parsedUrl;
  if (!port) {
    port = defaultPort(protocol);
  }
  let isAllowed;
  if (cache[protocol] && cache[protocol][port] && cache[protocol][port][hostname]) {
    isAllowed = cache[protocol][port][hostname];
  } else {
    isAllowed = await getAndParseRobotsTxt(protocol, port, hostname);
    if (!cache[protocol]) {
      cache[protocol] = {};
    }
    if (!cache[protocol][port]) {
      cache[protocol][port] = {};
    }

    // IDEA Maybe it would be better to cache the robotsTxt file itself as
    // opposed to this function. Maybe explore later
    cache[protocol][port][hostname] = isAllowed;
  }
  return isAllowed(url);
}

function defaultPort(protocol) {
  if (protocol === "http:") return 80;
  else if (protocol === "https:") return 443;
}

async function getAndParseRobotsTxt(protocol, port, hostname) {
  const robotsTxtUrl = `${protocol}//${hostname}:${port}/robots.txt`;
  let robotsResponse;
  logger.robotsRequestSent(robotsTxtUrl);
  try {
    robotsResponse = await axios({
      url: robotsTxtUrl,
      maxRedirects: 5
    });
  } catch (err) {
    return handleHttpError(err);
  }
  let parser

  // sometimes the robots.txt url returns unparseable nonsense
  try {
    parser = robotsParser(robotsTxtUrl, robotsResponse.data);
  } catch(err) {
    return approveAll
  }

  return url => parser.isAllowed(url, userAgent);
}

// Do what Google does: https://developers.google.com/search/reference/robots_txt
function handleHttpError(err) {
  // The request was made and the server responded with a status code
  // that falls out of the range of 2xx
  if (err.response) {
    if (err.response.status >= 500) {
      return approveNone;
    } else if (err.response.status >= 400) {
      return approveAll;
    } else if (err.response.status >= 300) {
      return approveAll;
    // I don't think I can ever get here
    } else {
      logger.unexpectedError(err.response, "status not 2xx, 3xx, 4xx or 5xx",
        { module: "robots-parser",
          url: err.config.url,
          headers: err.headers })
      return approveNone;
    }
    // The request was made but no response was received
  } else if (err.request) {
    logger.noRobotsResponseReceived(err.response, {
      module: "robots-parser",
      url: err.config.url
    });
    return approveNone;
    // Something happened in setting up the request that triggered an Error
  } else {
    logger.unexpectedError(err, "bad robots request", {
      module: "robots-parser",
      config: err.config
    });
    return approveNone;
  }
}

function approveAll() {
  return true;
}

function approveNone() {
  return false;
}

module.exports = isAllowed;
