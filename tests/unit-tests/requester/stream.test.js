// const { expect } = require("chai");
// const Events = require("events");
// const sinon = require("sinon");
// const TestStream = require("../../testStream");

// const makeRequestStream = require("APP/src/requester/");
// const makeLogger = require("APP/src/logger/");

// describe("request stream", () => {
//   it("returns a response for every inputted url", async () => {
//     const eventCoordinator = new Events();
//     const logger = makeLogger(eventCoordinator);
//     sinon.stub(logger);
//     const http = {
//       get: sinon
//         .stub()
//         .returns(
//           Promise.resolve({ data: streamify("<html><head></head><body>nick</body></html>") })
//         )
//     };
//     const requestStream = makeRequestStream(logger, http, eventCoordinator);
//     const testStream = new TestStream();
//     requestStream.pipe(testStream);

//     const urls = require("APP/seed-domains-sans-subs").map(url => "http://" + url);
//     for (const url of urls) {
//       requestStream.write(url);
//     }
//     requestStream.end();

//     const endPromise = new Promise(resolve => {
//       requestStream.on("end", () => {
//         resolve();
//         expect(testStream.buffer).to.have.lengthOf(urls.length);
//       });
//     });
//     return endPromise;
//   });
// });
