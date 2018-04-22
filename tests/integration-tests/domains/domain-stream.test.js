const Events = require("events");
const makeDomainStream = require("APP/src/domains");
const makeLogger = require("APP/src/logger");

function testAllUrlsReadFromStream(stream, seed, done) {
  let urlsRead = 0;
  const numberOfUrls = seed.length;

  stream.on("readable", () => {
    let url = stream.read();
    while (url !== null) {
      urlsRead += 1;
      if (seed.includes(url)) {
        const pos = seed.indexOf(url);
        seed.splice(pos, 1);
      }

      if (urlsRead === numberOfUrls && seed.length !== 0) {
        console.log("destroying");
        stream.destroy();
        done(new Error("Not every url was streamed"));
        return;
      }
      if (urlsRead === numberOfUrls && seed.length === 0) {
        console.log("destroying");
        stream.destroy();
        done();
        return;
      }

      url = stream.read();
    }
  });
}

describe("domain stream", () => {
  const eventCoordinator = new Events();
  const logger = makeLogger();

  it("returns all of the domains from the domain seed", done => {
    const seed = [
      "google.com",
      "youtube.com",
      "facebook.com",
      "wikipedia.com",
      "alibaba.com",
      "fakesite.com"
    ];
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);

    testAllUrlsReadFromStream(domainStream, seed, done);
  });

  it("handles large seeds appropriately", done => {
    const seed = require("APP/seed").slice(0, 25000);
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);

    testAllUrlsReadFromStream(domainStream, seed, done);
  });

  it("runs indefinitely if given the chance", () => {
    const seed = require("APP/seed").slice(0, 10);
    const domainStream = makeDomainStream(seed, eventCoordinator, logger);

    const urls = [];
    return new Promise((resolve, reject) => {
      setTimeout(reject, 3000);
      domainStream.on("readable", () => {
        let url = domainStream.read();

        while (urls.length < 21 && url !== null) {
          urls.push(url);
          url = domainStream.read();
        }
        if (urls.length >= 21) {
          domainStream.destroy();
          resolve();
        }
      });
    });
  }).timeout(3000);
});
