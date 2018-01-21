const path = require("path");
const express = require("express");
const ndjson = require("ndjson");
const { promisify } = require("util");
const { LOGGING_DIR } = require("../env");
const writeFile = promisify(require("fs").writeFile);
const mkdirp = promisify(require("mkdirp"));
const dateFormat = require("dateformat");

module.exports = function makeServer() {
  const app = express();
  const machines = {};
  const system = {
    requestsPerMinute: {},
    totalEvents: 0,
    totalRequests: 0,
    errors: [],
    requestResponseTimes: {},
    robotsResponseTimes: {}
  };
  const domains = {};

  app.post("/log", (req, res) => {
    req
      .pipe(ndjson.parse())
      .on("data", line => {
        line.timestamp = stripSecondsFromTime(line.time);
        trackErrors(line.err);
        trackMachineLevelEvents(line);
        trackDomainLevelEvents(line);
        trackSystemLevelEvents(line);
      })
      .on("end", () => {
        res.sendStatus(200);
      });
  });

  function stripSecondsFromTime(time) {
    const milliseconds = new Date(time).getTime();

    // Remove any trailing seconds and milliseconds, effectively reducing accuracy
    return milliseconds - Math.floor(milliseconds % (60 * 1000));
  }

  function trackErrors(err) {
    if (!err) return;

    system.errors.push(err);
  }

  function trackMachineLevelEvents(line) {
    const { codeModule, event, timestamp } = line;
    const machine = line.hostname;

    if (!machine || !codeModule || !event || !timestamp) {
      return;
    }

    if (!machines.hasOwnProperty(machine)) {
      machines[machine] = {};
      machines[machine].totalEvents = 0;
    }

    if (!machines[machine].hasOwnProperty(timestamp)) {
      machines[machine][timestamp] = {};
      machines[machine][timestamp].totalEvents = 0;
    }

    if (!machines[machine][timestamp].hasOwnProperty(codeModule)) {
      machines[machine][timestamp][codeModule] = {};
      machines[machine][timestamp][codeModule].totalEvents = 0;
    }

    if (!machines[machine][timestamp][codeModule].hasOwnProperty(event)) {
      machines[machine][timestamp][codeModule][event] = 0;
    }

    machines[machine].totalEvents += 1;
    machines[machine][timestamp].totalEvents += 1;
    machines[machine][timestamp][codeModule].totalEvents += 1;
    machines[machine][timestamp][codeModule][event] += 1;
  }

  function trackDomainLevelEvents(line) {
    const { domain, event } = line;
    let { subdomain } = line;

    if (!domain || !event) {
      return;
    }

    if (subdomain === undefined) return;
    if (subdomain === "") subdomain = "no subdomain";

    if (!domains.hasOwnProperty(domain)) {
      domains[domain] = {};
      domains[domain].subdomains = {};
      domains[domain].totalEvents = 0;
    }

    if (!domains[domain].subdomains.hasOwnProperty(subdomain)) {
      domains[domain].subdomains[subdomain] = {};
      domains[domain].subdomains[subdomain].totalEvents = 0;
    }

    if (!domains[domain].hasOwnProperty(event)) {
      domains[domain][event] = 0;
    }

    if (!domains[domain].subdomains[subdomain].hasOwnProperty(event)) {
      domains[domain].subdomains[subdomain][event] = 0;
    }

    domains[domain].subdomains[subdomain][event] += 1;
    domains[domain].subdomains[subdomain].totalEvents += 1;
    domains[domain].totalEvents += 1;
    domains[domain][event] += 1;
  }

  function trackSystemLevelEvents(line) {
    system.totalEvents += 1;
    const { codeModule, event, timestamp } = line;
    if (codeModule === "requester" && event === "request sent") {
      system.totalRequests += 1;

      if (system.requestsPerMinute.hasOwnProperty(timestamp)) {
        system.requestsPerMinute[timestamp] += 1;
      } else {
        system.requestsPerMinute[timestamp] = 1;
      }
    }

    if (event === "track response time") {
      if (codeModule === "requester") {
        if (system.requestResponseTimes.hasOwnProperty(timestamp)) {
          system.requestResponseTimes[timestamp].push(line.responseTime);
        } else {
          system.requestResponseTimes[timestamp] = [line.responseTime];
        }
      } else if (codeModule === "robots") {
        if (system.robotsResponseTimes.hasOwnProperty(timestamp)) {
          system.robotsResponseTimes[timestamp].push(line.responseTime);
        } else {
          system.robotsResponseTimes[timestamp] = [line.responseTime];
        }
      }
    }
  }

  app.get("/log/system", (req, res) => {
    res.send(system);
  });

  app.get("/log/machine", (req, res) => {
    res.send(machines);
  });

  app.get("/log/domain", (req, res) => {
    res.send(domains);
  });

  app.get("/log/error", (req, res) => {
    res.send(system.errors);
  });

  app.post("/log/save", async (req, res) => {
    const saveDirectory = path.join(LOGGING_DIR, "stats");
    mkdirp(saveDirectory).then(_ => {
      return writeFile(
        path.join(saveDirectory, dateFormat(Date.now(), "ddd dd h:M")),
        JSON.stringify({
          system,
          machines,
          domains
        })
      );
    });
    res.sendStatus(202);
  });

  app.use((err, req, res, next) => {
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
