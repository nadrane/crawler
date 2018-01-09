const Events = require("events");
const fs = require("fs");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeDomainStream = require("APP/src/domains");
const makeLogger = require("APP/src/logger");

function testAllUrlsReadFromStream(stream, seed, done) {
  let urlsRead = 0;
  const numberOfUrls = seed.length;
  stream.on("readable", () => {
    let url = stream.read();
    urlsRead += 1;
    if (url.startsWith("http://")) {
      url = url.split("http://")[1];
    }
    if (seed.includes(url)) {
      const pos = seed.indexOf(url);
      seed.splice(pos, 1);
    }
    if (urlsRead === numberOfUrls && seed.length !== 0) {
      done(new Error("Not every url was streamed"));
    }
    if (urlsRead === numberOfUrls && seed.length === 0) {
      done();
    }
  });
}

describe("domain stream", () => {
  beforeEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  afterEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  it("returns a sequence of different urls from the seed file", done => {
    const eventCoordinator = new Events();
    const logger = makeLogger(eventCoordinator);
    const seed = [
      "google.com",
      "youtube.com",
      "facebook.com",
      "wikipedia.com",
      "alibaba.com",
      "fakesite.com"
    ];
    const domainStream = makeDomainStream(seed, eventCoordinator, fs, logger, 1);

    testAllUrlsReadFromStream(domainStream, seed, done);
  });

  it("handles backpressure appropriately", done => {
    const eventCoordinator = new Events();
    const logger = makeLogger(eventCoordinator);
    const seed = require("APP/seed-domains-sans-subs");
    const domainStream = makeDomainStream(seed, eventCoordinator, fs, logger, 20);

    testAllUrlsReadFromStream(domainStream, seed, done);
  }).timeout(6000);

  // I'm trying to verify that the pause()/resume() API works like I think.
  // It seems to, though I'm not sure how to formulate this as a real test
  // without creating some kind of in-memory test stream. But that would just be
  // testing the NodeJS core stream API anyway... I'll leave this here anyhow in
  // in case it's useful when plugging the various streams together
  // it.only("stops emitted urls when the stream is paused", done => {
  //   const eventCoordinator = new Events();
  //   const seed = require("APP/seed-domains-sans-subs");
  //   const domainStream = makeDomainStream(20, seed, eventCoordinator);
  //   domainStream.pipe(process.stdout);
  //   setTimeout(() => {
  //     eventCoordinator.emit("stop");
  //     setTimeout(() => {
  //       eventCoordinator.emit("start");
  //     }, 3000);
  //   }, 500);
  // }).timeout(6000);
});
