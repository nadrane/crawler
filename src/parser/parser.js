const { Transform } = require("stream");
const htmlparser = require("htmlparser2");
const { URL } = require("url");
// const logger = require("../logger")();



class htmlTolinkStream extends Transform {
  constructor(url) {
    super();
    this.originalUrl = url;
    this.backPressure = false

    this.parser = new htmlparser.Parser(
      {
        onopentag: (name, attribs) => {
          const href = attribs.href
          if (this._tagContainsValidUrl(name, href)) {
            const parsedUrl = new URL(href, this.originalUrl);
            this.push(parsedUrl.toString() + '\n')
          }
        },
        onend: () => {
          this.emit("finished", url);
        },
        onerror: err => {
          console.error('error', err)
          // logger.parserError(err, url);
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
        return false;
      }
    }
  }

  _transform(buffer, enc, next) {
    this.parser.write(buffer)
    next();
  }

  _final() {
    this.parser.parseComplete();
  }
}

module.exports = htmlTolinkStream;
