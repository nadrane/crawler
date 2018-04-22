const { expect } = require("chai");
const makeDomainStream = require("APP/src/domains");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

const seed = [
  "google.com",
  "youtube.com",
  "facebook.com",
  "wikipedia.com",
  "alibaba.com",
  "fakesite.com"
];

describe("Domain Stream", () => {
  const logger = makeLogger();
  const eventCoordinator = new Events();

  it("begins paused", () => {
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);
    expect(domainStream.isPaused()).to.be.true;
  });

  it("pauses the stream whent the 'stop' event is emitted", () => {
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);
    domainStream.emit("start");

    eventCoordinator.emit("stop");
    expect(domainStream.isPaused()).to.be.true;
  });

  it("resumes the stream whent the 'start' event is emitted", () => {
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);
    eventCoordinator.emit("start");

    expect(domainStream.isPaused()).to.be.false;
  });

  it("streams a list of domains to writables", done => {
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);
    eventCoordinator.emit("start");
    const streamedDomains = [];

    domainStream.on("data", domains => {
      streamedDomains.push(domains);
      if (streamedDomains.length === 6) {
        expect(streamedDomains).to.deep.equal(seed);
        done();
      }
    });
  });

  // @TODO use sinon here. it will just speed up the test
  it("restarts from the beginning of the domain list 1 second after depleting", done => {
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);
    eventCoordinator.emit("start");
    const streamedDomains = [];

    domainStream.on("data", domains => {
      streamedDomains.push(domains);
      if (streamedDomains.length === 12) {
        done();
      }
    });
  });
});
