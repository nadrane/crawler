const { expect } = require("chai");
const makeServer = require("APP/statistics/server");
const request = require("supertest");

describe("Stats Server", () => {
  it("initially responds with default stats", () => {
    const server = makeServer();
    return request(server)
      .get("/log")
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.equal({ RPM: [], currentRPM: 0, stats: {}, totalRequests: 0 });
      });
  });

  it("records domain and hostname level stats", () => {
    const server = makeServer();
    const r = request(server);
    const logs = [
      { domain: "google.com", hostname: 1, event: "request sent" },
      { domain: "yahoo.com", hostname: 2, event: "request sent" },
      { domain: "google.com", hostname: 1, event: "request sent" },
      { domain: "google.com", hostname: 1, event: "robots sent" }
    ]
      .map(JSON.stringify)
      .join("\n");

    const statsExpectation = {
      1: {
        "request sent": 2,
        "robots sent": 1,
        totalEvents: 3
      },
      2: {
        "request sent": 1,
        totalEvents: 1
      },
      "google.com": {
        "request sent": 2,
        "robots sent": 1,
        totalEvents: 3
      },
      "yahoo.com": {
        "request sent": 1,
        totalEvents: 1
      }
    };

    return r
      .post("/log")
      .send(logs)
      .expect(200)
      .then(() => {
        return r.get("/log").then(res => {
          expect(res.body).to.deep.equal({
            RPM: [],
            currentRPM: 3,
            stats: statsExpectation,
            totalRequests: 3
          });
        });
      });
  });
});
