const { expect } = require("chai");
const makeServer = require("APP/statistics/server");
const request = require("supertest");

describe("Stats Server", () => {
  it("initially responds with default stats", () => {
    return request(makeServer())
      .get("/log")
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.equal({
          RPM: [],
          errors: [],
          currentRPM: 0,
          stats: {},
          totalRequests: 0
        });
      });
  });

  it("only records hostname level stats if no domain is provided", () => {
    const r = request(makeServer());
    const logs = [
      { hostname: 1, codeModule: "requester", event: "request sent" },
      { hostname: 2, codeModule: "requester", event: "request sent" },
      { hostname: 1, codeModule: "requester", event: "request sent" },
      { hostname: 1, codeModule: "robots", event: "robots sent" }
    ]
      .map(JSON.stringify)
      .join("\n");

    const statsExpectation = {
      1: {
        totalEvents: 3,
        requester: { totalEvents: 2, "request sent": 2 },
        robots: { totalEvents: 1, "robots sent": 1 }
      },
      2: {
        totalEvents: 1,
        requester: { totalEvents: 1, "request sent": 1 }
      }
    };

    return r
      .post("/log")
      .send(logs)
      .expect(200)
      .then(() => {
        return r.get("/log").then(res => {
          console.dir(res.body, { depth: 5 });
          expect(res.body).to.deep.equal({
            RPM: [],
            errors: [],
            currentRPM: 3,
            stats: statsExpectation,
            totalRequests: 3
          });
        });
      });
  });
  it("only records domain level stats if a domain is provided", () => {
    const r = request(makeServer());
    const logs = [
      { domain: "google.com", subdomain: "www", event: "request sent" },
      { domain: "google.com", subdomain: "www", event: "request sent" },
      { domain: "google.com", subdomain: "", event: "request sent" },
      { domain: "yahoo.com", subdomain: "www", event: "robots sent" }
    ]
      .map(JSON.stringify)
      .join("\n");

    const statsExpectation = {
      "google.com": {
        "request sent": 3,
        subdomains: {
          "no subdomain": {
            "request sent": 1,
            totalEvents: 1
          },
          www: {
            "request sent": 2,
            totalEvents: 2
          }
        },
        totalEvents: 3
      },
      "yahoo.com": {
        "robots sent": 1,
        subdomains: {
          www: {
            "robots sent": 1,
            totalEvents: 1
          }
        },
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
            errors: [],
            currentRPM: 3,
            stats: statsExpectation,
            totalRequests: 3
          });
        });
      });
  });
});
