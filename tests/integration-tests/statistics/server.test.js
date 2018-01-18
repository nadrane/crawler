const path = require("path");
const { promisify } = require("util");
const readFileAsync = promisify(require("fs").readFile);

const { expect } = require("chai");
const request = require("supertest");

const makeServer = require("APP/statistics/server");

describe.only("Stats Server", () => {
  it("initially responds with default stats", () => {
    return request(makeServer())
      .get("/log")
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.equal({
          RPM: {},
          errors: [],
          stats: {},
          totalRequests: 0,
          totalEvents: 0
        });
      });
  });

  it("only records hostname level stats if no domain is provided", () => {
    const r = request(makeServer());
    const logs = [
      { hostname: 1, codeModule: "requester", event: "request sent" },
      { hostname: 2, codeModule: "requester", event: "request sent" },
      { hostname: 1, codeModule: "requester", event: "request sent" },
      { hostname: 1, codeModule: "robots", event: "request sent" }
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
      },
      totalEvents: 4
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
      totalEvents: 4,
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
            stats: statsExpectation,
            totalRequests: 3
          });
        });
      });
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
      .then(() => {
        return r.get("/log").then(res => {
          expect(res.body.totalEvents).to.equal(5000);
        });
      });
  });
});
