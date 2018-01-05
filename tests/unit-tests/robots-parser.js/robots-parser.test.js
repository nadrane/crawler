const sinon = require("sinon");
const { expect } = require("chai");
const makeRobotsValidator = require("APP/src/robots-parser/robots-parser");

describe("robots-parser", () => {
  describe("isAllowed", () => {
    it("allows all urls when the robots.txt approves everything", async () => {
      const isAllowed = makeRobotsValidator();
      const httpStub = sinon.stub().returns(Promise.resolve({ data: "User-agent: *\nDisallow:" }));

      expect(await isAllowed("http://google.com", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/search", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/nick/knack/knock", httpStub)).to.be.true;
    });
    it("works when some urls contain a port and others don't, even if the ports are nonstandard", async () => {
      const isAllowed = makeRobotsValidator();
      const httpStub = sinon.stub().returns({ data: "User-agent: *\nDisallow:" });

      expect(await isAllowed("http://google.com:80", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/search", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com:8080/nick/knack/knock ", httpStub)).to.be.true;
    });
    it("approves nothing if the robots url returns 5xx", async () => {
      const isAllowed = makeRobotsValidator();
      const robotsError = new Error();
      robotsError.response = { status: 500 };
      const httpStub = sinon.stub().returns(Promise.reject(robotsError));

      expect(await isAllowed("http://facebook.com", httpStub)).to.be.false;
      expect(await isAllowed("http://google.com/theBestSite", httpStub)).to.be.false;
      expect(await isAllowed("http://youtube.com/ ", httpStub)).to.be.false;
    });
    it("approves everything if the robots url returns 4xx", async () => {
      const isAllowed = makeRobotsValidator();
      const robotsError = new Error();
      robotsError.response = { status: 400 };
      const httpStub = sinon.stub().returns(Promise.reject(robotsError));

      expect(await isAllowed("http://facebook.com", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/theBestSite", httpStub)).to.be.true;
      expect(await isAllowed("http://youtube.com/ ", httpStub)).to.be.true;
    });

    it.skip("approves nothing if there was no response for the robots file from the server", async () => {
      const isAllowed = makeRobotsValidator();
      const robotsError = new Error();
      robotsError.request = { };
      const httpStub = sinon.stub().returns(Promise.reject(robotsError));

      expect(await isAllowed("http://facebook.com", httpStub)).to.be.false;
      expect(await isAllowed("http://google.com/theBestSite", httpStub)).to.be.false;
      expect(await isAllowed("http://youtube.com/ ", httpStub)).to.be.false;
    });
  });
});
