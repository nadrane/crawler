const sinon = require("sinon");
const { expect } = require("chai");
const isAllowed = require("APP/src/robots-parser/robots-parser");

describe("robots-parser", () => {
  describe("isAllowed", () => {
    it("allows all urls when the robots.txt approves everything", async () => {
      const httpStub = sinon.stub().returns({ data: "User-agent: *\nDisallow:" });

      expect(await isAllowed("http://google.com", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/search", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/nick/knack/knock", httpStub)).to.be.true;
    });
    it("works when some urls contain a port and others don't, even if the ports are nonstandard", async () => {
      const httpStub = sinon.stub().returns({ data: "User-agent: *\nDisallow:" });

      expect(await isAllowed("http://google.com:80", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com/search", httpStub)).to.be.true;
      expect(await isAllowed("http://google.com:8080/nick/knack/knock ", httpStub)).to.be.true;
    });
  });
});
