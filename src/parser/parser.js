const { Transform } = require("stream");
const htmlparser = require("htmlparser2");
const { URL } = require("url");
const logger = require("../logger")();

class HtmlTolinkStream extends Transform {
  constructor(url, eventCoordinator) {
    super();
    this.originalUrl = url;
    this.backPressure = false;

    this.parser = new htmlparser.Parser(
      {
        onopentag: (name, attribs) => {
          const { href } = attribs;
          if (this._tagContainsValidUrl(name, href)) {
            const parsedUrl = new URL(href, this.originalUrl);
            eventCoordinator.emit("new link", {
              fromUrl: this.originalUrl,
              newUrl: parsedUrl.toString()
            });
          }
        },
        onerror: err => {
          logger.parserError(err, url);
        }
      },
      { decodeEntities: true }
    );
  }

  _tagContainsValidUrl(name, href) {
    const validLinkProtocols = ["http:", "https:"];
    if (name === "a") {
      try {
        const parsedUrl = new URL(href, this.originalUrl);
        // Ignore the psuedo javascript protocol and whatever else sites throw at me.
        return validLinkProtocols.includes(parsedUrl.protocol);
      } catch (err) {
        // The url is no WHATWG(thttps://url.spec.whatwg.org) compliant
        if (!(err instanceof TypeError)) {
          throw err;
        }
      }
    }
    return false;
  }

  _transform(buffer, enc, next) {
    this.parser.write(buffer);
    next();
  }

  _final(done) {
    this.parser.parseComplete();
    done(); // execute the finish event
  }
}

module.exports = function makeParserStream(url, eventCoordinator) {
  const stream = new HtmlTolinkStream(url, eventCoordinator);
  stream.on("error", err => {
    logger.unexpectError(err, "parser stream error");
  });
  return stream;
};
