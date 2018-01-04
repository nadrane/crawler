const { expect } = require("chai");
const makeDomainStream = require("APP/src/domains");
const Events = require("events");
const sinon = require("sinon");

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
    const domainStream = makeDomainStream(1, seed, eventCoordinator);

    expect(domainStream.isPaused()).to.be.false;
    eventCoordinator.emit("stop");
    expect(domainStream.isPaused()).to.be.true;
  });

  it("resumes the stream whent the 'start' event is emitted", () => {
    const eventCoordinator = new Events();
    const domainStream = makeDomainStream(1, seed, eventCoordinator);

    domainStream.pause();
    eventCoordinator.emit("start");
    expect(domainStream.isPaused()).to.be.false;
  });
});
