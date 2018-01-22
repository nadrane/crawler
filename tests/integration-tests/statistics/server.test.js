const path = require("path");
const { promisify } = require("util");
const { expect } = require("chai");
const request = require("supertest");
const readFileAsync = promisify(require("fs").readFile);
const rimraf = promisify(require("rimraf"));

const { LOGGING_DIR } = require("APP/env");
const makeServer = require("APP/statistics/server");

describe("Stats Server", () => {
  beforeEach(() => {
    return rimraf(LOGGING_DIR);
  });
  afterEach(() => {
    return rimraf(LOGGING_DIR);
  });

  it("correctly processes large log file", async () => {
    const r = request(makeServer());
    let logs = await readFileAsync(path.join(__dirname, "sample-large-log.txt"));
    logs = logs
      .toString()
      .split("\n")
      .filter(line => line)
      .join("\n");

    return r
      .post("/log")
      .send(logs)
      .expect(200)
      .then(res => res.body)
      .then(({ logFile }) => {
        return readFileAsync(logFile);
      })
      .then(logContent => {
        expect(logContent.toString()).to.deep.equal(logs);
      });
  });
});
