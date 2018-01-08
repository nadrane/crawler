const { URL } = require("url");
const robotsParser = require("robots-parser");
const LRU = require("lru-cache");
const { USER_AGENT } = require("APP/env/");

const makeRobotsTxtUrl = (protocol, port, hostname) =>
  port ? `${protocol}//${hostname}:${port}/robots.txt` : `${protocol}//${hostname}/robots.txt`;
const makeCacheKey = (protocol, port, hostname) =>
  port ? `${protocol}|${port}|${hostname}` : `${protocol}|${hostname}`;
const approveAll = () => true;
const approveNone = () => false;

// IDEA garbage collection of robots cache
// Maybe an LRU cache? Or eliminate if a domains frontier is empty for too long?
async function isAllowed(cache, logger, http, url) {
  // A given robotsTxt file is valid for a given hostname, protocol, port combination (https://developers.google.com/search/reference/robots_txt)
  // A robotsTxt file is not valid in subdomains of its url.
  // We want to cache robotsTxt results to avoid making an extra network request for every page.

  let parsedUrl;
  let allowed;
  try {
    // It might not be possible to parse some urls
    parsedUrl = new URL(url);
  } catch (err) {
    return false;
  }
  const { protocol, hostname, port } = parsedUrl;

  if (cache.peek(makeCacheKey(protocol, port, hostname))) {
    allowed = cache.get(makeCacheKey(protocol, port, hostname));
  } else {
    // IDEA Maybe it would be better to cache the robotsTxt file itself as
    // opposed to this function. Maybe explore later
    allowed = await getAndParseRobotsTxt(makeRobotsTxtUrl(protocol, port, hostname), http, logger);
    cache.set(makeCacheKey(protocol, port, hostname), allowed);
  }
  return allowed(parsedUrl.toString());
}

async function getAndParseRobotsTxt(robotsTxtUrl, http, logger) {
  let robotsResponse;
  logger.robotsRequestSent(robotsTxtUrl);
  try {
    robotsResponse = await http({
      url: robotsTxtUrl,
      timeout: 2000,
      maxRedirects: 5
    });
  } catch (err) {
    return handleHttpError(err, logger);
  }
  let parser;

  // sometimes the robots.txt url returns unparseable nonsense
  try {
    parser = robotsParser(robotsTxtUrl, robotsResponse.data);
  } catch (err) {
    return approveAll;
  }
  return url => parser.isAllowed(url, USER_AGENT);
}

// Do what Google does: https://developers.google.com/search/reference/robots_txt
function handleHttpError(err, logger) {
  // The request was made and the server responded with a status code
  // that falls out of the range of 2xx
  if (err.response) {
    if (err.response.status >= 500) {
      return approveNone;
    } else if (err.response.status >= 400) {
      return approveAll;
    } else if (err.response.status >= 300) {
      return approveAll;
      // I don't think I can ever get here because 3xx wouldn't reject...
    }
    logger.unexpectedError(err.response, "status not 2xx, 3xx, 4xx or 5xx", {
      module: "robots-parser",
      url: err.config.url,
      headers: err.headers
    });
    return approveNone;

    // The request was made but no response was received
  } else if (err.request) {
    logger.noRobotsResponseReceived(err.response, {
      module: "robots-parser",
      url: err.config.url
    });
    return approveNone;
    // Something happened in setting up the request that triggered an Error
  }
  // TODO add condition for timeouts
  logger.unexpectedError(err, "bad robots request", {
    module: "robots-parser",
    config: err.config
  });
  return approveNone;
}

module.exports = function makeRobotsValidator(
  logger,
  http,
  domainsPerServer = 20000,
  maxCacheAge = 1000 * 60 * 60
) {
  const cache = LRU({
    max: domainsPerServer,
    maxAge: maxCacheAge
  });
  return isAllowed.bind(null, cache, logger, http);
};
