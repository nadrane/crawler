const sinon = require("sinon");
const { expect } = require("chai");
const makeRobotsValidator = require("APP/src/robots-parser/robots-parser");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

describe.only("robots-parser", () => {
  describe("isAllowed", () => {
    it("allows all urls when the robots.txt approves everything", async () => {
      const logger = makeLogger(new Events());
      const http = sinon.stub().returns(Promise.resolve({ data: "User-agent: *\nDisallow:" }));
      const isAllowed = makeRobotsValidator(logger, http);

      expect(await isAllowed("http://google.com")).to.be.true;
      expect(await isAllowed("http://google.com/search")).to.be.true;
      expect(await isAllowed("http://google.com/nick/knack/knock")).to.be.true;
    });

    it("works when some urls contain a port and others don't, even if the ports are nonstandard", async () => {
      const logger = makeLogger(new Events());
      const http = sinon.stub().returns(Promise.resolve({ data: "User-agent: *\nDisallow:" }));
      const isAllowed = makeRobotsValidator(logger, http);

      expect(await isAllowed("http://google.com:80")).to.be.true;
      expect(await isAllowed("http://google.com/search")).to.be.true;
      expect(await isAllowed("http://google.com:8080/nick/knack/knock ")).to.be.true;
    });

    it("approves nothing if the robots url returns 5xx", async () => {
      const logger = makeLogger(new Events());
      const robotsError = new Error();
      robotsError.response = { status: 500 };
      const http = sinon.stub().returns(Promise.reject(robotsError));
      const isAllowed = makeRobotsValidator(logger, http);

      expect(await isAllowed("http://facebook.com")).to.be.false;
      expect(await isAllowed("http://google.com/theBestSite")).to.be.false;
      expect(await isAllowed("http://youtube.com/ ")).to.be.false;
    });

    it("approves everything if the robots url returns 4xx", async () => {
      const logger = makeLogger(new Events());
      const robotsError = new Error();
      robotsError.response = { status: 400 };
      const http = sinon.stub().returns(Promise.reject(robotsError));
      const isAllowed = makeRobotsValidator(logger, http);

      expect(await isAllowed("http://facebook.com")).to.be.true;
      expect(await isAllowed("http://google.com/theBestSite")).to.be.true;
      expect(await isAllowed("http://youtube.com/ ")).to.be.true;
    });

    it("approves nothing if there was no response for the robots file from the server", async () => {
      const logger = makeLogger(new Events());

      const robotsError = new Error();
      robotsError.config = {
        url: "http://facebook.com"
      };
      robotsError.request = {};
      const http = sinon.stub().returns(Promise.reject(robotsError));
      const isAllowed = makeRobotsValidator(logger, http);
      expect(await isAllowed("http://facebook.com")).to.be.false;

      const robotsError2 = new Error();
      robotsError2.config = {
        url: "http://google.com/theBestSite"
      };
      robotsError2.request = {};
      const http2 = sinon.stub().returns(Promise.reject(robotsError2));
      const isAllowed2 = makeRobotsValidator(logger, http2);
      expect(await isAllowed2("http://google.com/theBestSite")).to.be.false;
    });
  });
});
