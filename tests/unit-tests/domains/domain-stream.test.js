const { expect } = require("chai");
const makeDomainStream = require("APP/src/domains");
const makeLogger = require("APP/src/logger/");
const Events = require("events");
const sinon = require("sinon");
const fs = require("fs");

const seed = [
  "google.com",
  "youtube.com",
  "facebook.com",
  "wikipedia.com",
  "alibaba.com",
  "fakesite.com"
];

describe("Domain Stream", () => {
  const storage = {};
  beforeEach(() => {
    storage.writeFileSync = sinon.spy();
    storage.readFileAsync = sinon.spy();
    storage.writeFileAsync = sinon.spy();
    storage.appendFileAsync = sinon.spy();
  });

  it("pauses the stream whent the 'stop' event is emitted", () => {
    const eventCoordinator = new Events();
    const logger = makeLogger(eventCoordinator);
    const domainStream = makeDomainStream(seed, eventCoordinator, fs, logger, 1);

    expect(domainStream.isPaused()).to.be.false;
    eventCoordinator.emit("stop");
    expect(domainStream.isPaused()).to.be.true;
  });

  it("resumes the stream whent the 'start' event is emitted", () => {
    // QUESTION: Should I just pass blank objects in if they aren't used?
    //    or this? Or just stub them?
    // QUESTION: To what degree should I leverage depdency injection? I feel like the complexity is not worth it if it's overused
    // just to prevent a side-effect in one test. What other alternatives are there for breaking dependencies? How do you feel about
    // stub global imports? Is this something you see in production code? example: mkdirp in logging module.
    const eventCoordinator = new Events();
    const logger = makeLogger(eventCoordinator);
    const domainStream = makeDomainStream(seed, eventCoordinator, fs, logger, 1);

    domainStream.pause();
    eventCoordinator.emit("start");
    expect(domainStream.isPaused()).to.be.false;
  });
});
