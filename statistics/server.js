const express = require("express");
const ndjson = require("ndjson");

module.exports = function makeServer() {
  const app = express();
  const stats = {
    machines: {}
  };
  const errors = [];
  const requestsPerMinute = {};
  let totalRequests = 0;
  let totalEvents = 0;

  app.post("/log", (req, res) => {
    req
      .pipe(ndjson.parse())
      .on("data", line => {
        const { event, domain, subdomain, codeModule, err, time } = line;
        const machine = line.hostname;

        const options = { day: "numeric", hour: "numeric", minute: "numeric" };
        const timestamp = new Date(time).toLocaleDateString("en-US", options);

        trackErrors(err);
        trackMachineLevelEvents(machine, codeModule, event, timestamp);
        trackDomainLevelEvents(domain, subdomain, event);
        trackSystemLevelEvents(codeModule, event, timestamp);
      })
      .on("end", () => {
        res.sendStatus(200);
      });
  });

  function trackErrors(err) {
    if (!err) return;

    errors.push(err);
  }

  function trackMachineLevelEvents(machine, codeModule, event, timestamp) {
    if (!machine || !codeModule || !event || !timestamp) {
      return;
    }

    if (!stats.machines.hasOwnProperty(machine)) {
      stats.machines[machine] = {};
      stats.machines[machine].totalEvents = 0;
    }

    if (!stats.machines[machine].hasOwnProperty(timestamp)) {
      stats.machines[machine][timestamp] = {};
      stats.machines[machine][timestamp].totalEvents = 0;
    }

    if (!stats.machines[machine][timestamp].hasOwnProperty(codeModule)) {
      stats.machines[machine][timestamp][codeModule] = {};
      stats.machines[machine][timestamp][codeModule].totalEvents = 0;
    }

    if (!stats.machines[machine][timestamp][codeModule].hasOwnProperty(event)) {
      stats.machines[machine][timestamp][codeModule][event] = 0;
    }

    stats.machines[machine].totalEvents += 1;
    stats.machines[machine][timestamp].totalEvents += 1;
    stats.machines[machine][timestamp][codeModule].totalEvents += 1;
    stats.machines[machine][timestamp][codeModule][event] += 1;
  }

  function trackDomainLevelEvents(domain, subdomain, event) {
    if (!domain || !event) {
      return;
    }

    if (subdomain === undefined) return;
    if (subdomain === "") subdomain = "no subdomain";

    if (!stats.hasOwnProperty(domain)) {
      stats[domain] = {};
      stats[domain].subdomains = {};
      stats[domain].totalEvents = 0;
    }

    if (!stats[domain].subdomains.hasOwnProperty(subdomain)) {
      stats[domain].subdomains[subdomain] = {};
      stats[domain].subdomains[subdomain].totalEvents = 0;
    }

    if (!stats[domain].hasOwnProperty(event)) {
      stats[domain][event] = 0;
    }

    if (!stats[domain].subdomains[subdomain].hasOwnProperty(event)) {
      stats[domain].subdomains[subdomain][event] = 0;
    }

    stats[domain].subdomains[subdomain][event] += 1;
    stats[domain].subdomains[subdomain].totalEvents += 1;
    stats[domain].totalEvents += 1;
    stats[domain][event] += 1;
  }

  function trackSystemLevelEvents(codeModule, event, timestamp) {
    totalEvents += 1;

    if (codeModule === "requester" && event === "request sent") {
      totalRequests += 1;

      if (requestsPerMinute.hasOwnProperty(timestamp)) {
        requestsPerMinute[timestamp] += 1;
      } else {
        requestsPerMinute[timestamp] = 1;
      }
    }
  }

  app.get("/system", (req, res) => {
    res.send({
      errors,
      RPM: requestsPerMinute,
      totalRequests
    });
  });

  app.get("/machine", (req, res) => {
    res.send({
      machines: stats.machines
    });
  });

  app.get("/log", (req, res) => {
    res.send({
      errors,
      RPM: requestsPerMinute,
      totalRequests,
      totalEvents,
      stats
    });
  });
  app.use((err, req, res, next) => {
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
