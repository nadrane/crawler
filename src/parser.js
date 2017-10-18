const { Writable } = require("stream");
const htmlparser = require("htmlparser2");
const { URL } = require("url");
const logger = require("./logger");

const validLinkProtocols = ["http:", "https:"];

function tagContainsValidUrl(name, href) {
  if (name === "a") {
    try {
      const parsedUrl = new URL(href);
      // Ignore the psuedo javascript protocol and whatever else sites throw at me.
      return validLinkProtocols.includes(parsedUrl.protocol);
    } catch (err) {
      // The url is no WHATWG(thttps://url.spec.whatwg.org) compliant
      if (!(err instanceof TypeError)) {
        throw err;
      }
      return false;
    }
  }
}

class htmlTolinkStream extends Writable {
  constructor(url) {
    super();
    this.url = url;
    this.parser = new htmlparser.Parser(
      {
        onopentag: (name, attribs) => {
          if (tagContainsValidUrl(name, attribs.href)) {
            this.emit("new link", { fromUrl: url, newUrl: attribs.href });
          }
        },
        onend: () => {
          this.emit("finished", url);
        },
        onerror: err => {
          logger.parserError(err, url)
        }
      },
      { decodeEntities: true }
    );
  }

  _write(buffer, enc, next) {
    this.parser.write(buffer);
    next();
  }

  _final() {
    this.parser.parseComplete();
  }
}

module.exports = htmlTolinkStream;
