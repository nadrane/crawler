const Events = require("events");
const { expect } = require("chai");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeDomainStream = require("APP/src/domains");

function testAllUrlsReadFromStream(stream, seed, done) {
  let urlsRead = 0;
  const numberOfUrls = seed.length;
  stream.on("readable", () => {
    const url = stream.read();
    urlsRead += 1;
    if (seed.includes(url)) {
      const pos = seed.indexOf(url);
      seed.splice(pos, 1);
    }
    if (urlsRead === numberOfUrls && seed.length !== 0) {
      console.log(seed)
      done(new Error("Not every url was streamed"))
    }
    if (urlsRead === numberOfUrls && seed.length === 0) {
      done();
    }
  });
}

describe.only("domain stream", () => {
  beforeEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  afterEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  it("returns a sequence of different urls from the seed file", done => {
    const eventCoordinator = new Events();
    const seed = [
      "http://google.com",
      "http://youtube.com",
      "http://facebook.com",
      "http://wikipedia.com",
      "http://alibaba.com",
      "http://fakesite.com"
    ];
    const domainStream = makeDomainStream(2, seed, eventCoordinator);

    testAllUrlsReadFromStream(domainStream, seed, done);
  });
  it("handles backpressure appropriately", done => {
    const eventCoordinator = new Events();
    const seed = require('APP/seed-domains')
    const domainStream = makeDomainStream(2, seed, eventCoordinator);

    testAllUrlsReadFromStream(domainStream, seed, done);
  }).timeout(5000);
});
