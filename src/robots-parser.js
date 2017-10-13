const robots = require("robots");
const logger = require("./logger");

const userAgent = "test crawler - nicholasdrane@gmail.com";

class RobotParser {
  constructor(domain) {
    // use subdomains for this one,
    this.parser = new Promise(function(resolve, reject) {
      new robots.RobotsParser().setUrl(`http://www.${domain}/robots.txt`, function(parser, success) {
        if (success) {
          resolve(parser);
        } else {
          reject();
        }
      });
    });
  }

  async canScrape(url) {
    let parser;
    try {
      parser = await this.parser;
    } catch (err) {
      logger.unexpectedError(err, {
        event: "parsing robots.txt",
        message: "error while awaiting parser promise"
      });
    }
    if (parser) {
      if (parser.canFetchSync(userAgent, url) === false) console.log('false',url)
      else console.log('true', url)
    }
    return parser ? parser.canFetchSync(userAgent, url) : true;
  }
}

module.exports = RobotParser;
