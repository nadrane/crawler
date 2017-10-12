const robots = require("robots");

module.exports = domain => {
  let successfullyParsed = false;
  let cachedParser;

  return new Promise(function(resolve, reject) {
    new robots.RobotsParser().setUrl(`http://${domain}/robots.txt`, function(parser, success) {
      if (success) {
        resolve(parser)
      } else {
          reject()
        }
      }
  )});

  return function canScrape(userAgent, url) {
    // This doesn't do IO despite the name
    return successfullyParsed && parser.canFetchSync(userAgent, url);
  };
};
