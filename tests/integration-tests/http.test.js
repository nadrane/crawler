const makeTrackingHttp = require("APP/src/http");
const sinon = require("sinon");
const { expect } = require("chai");

describe("http", () => {
  it("emits a size event specifying the length of the response body", async () => {
    const codeModule = "fakeModule";
    const logger = { [codeModule]: { trackResponseTime: sinon.spy() } };
    const http = makeTrackingHttp(logger, { codeModule, maxContentLength: 1024 * 500 });

    const responseStream = await http({
      url: "http://www.google.com",
      responseType: "stream"
    });

    let responseBody = Buffer.from([]);
    responseStream.on("data", data => {
      responseBody = Buffer.concat([responseBody, data]);
    });
    responseStream.on("end", data => {
      if (data) {
        responseBody = Buffer.concat([responseBody, data]);
      }
    });

    return new Promise((resolve, reject) => {
      responseStream.on("size", size => {
        try {
          expect(size).to.equal(responseBody.length);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });

  it("emits an error event with the current body size if the maximum size is exceeded", async () => {
    const codeModule = "fakeModule";
    const logger = { [codeModule]: { trackResponseTime: sinon.spy() } };
    const http = makeTrackingHttp(logger, { codeModule, maxContentLength: 1024 * 5 });

    const responseStream = await http({
      url: "http://www.google.com",
      responseType: "stream"
    });

    return new Promise((resolve, reject) => {
      responseStream.on("error", err => {
        try {
          expect(err.bytesDownloads).to.not.be.undefined;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
