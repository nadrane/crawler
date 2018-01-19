const express = require("express");
const ndjson = require("ndjson");
const fs = require("fs");

module.exports = function makeServer() {
  const app = express();

  const machines = {};
  const system = {
    requestsPerMinute: {},
    totalEvents: 0,
    totalRequests: 0,
    errors: []
  };
  const domains = {};

  app.post("/log", (req, res) => {
    req
      .pipe(ndjson.parse())
      .on("data", line => {
        const { event, domain, subdomain, codeModule, err, time } = line;
        const machine = line.hostname;

        const options = {
          timeZone: "America/Chicago",
          day: "numeric",
          hour: "numeric",
          minute: "numeric"
        };
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

    system.errors.push(err);
  }

  function trackMachineLevelEvents(machine, codeModule, event, timestamp) {
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

  function trackDomainLevelEvents(domain, subdomain, event) {
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

  function trackSystemLevelEvents(codeModule, event, timestamp) {
    system.totalEvents += 1;

    if (codeModule === "requester" && event === "request sent") {
      system.totalRequests += 1;

      if (system.requestsPerMinute.hasOwnProperty(timestamp)) {
        system.requestsPerMinute[timestamp] += 1;
      } else {
        system.requestsPerMinute[timestamp] = 1;
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

  app.post("/log/save", (req, res) => {
    fs.writeFile(
      `logs/${Date.now().toLocaleString()}`,
      JSON.stringify({
        system,
        machines,
        domains
      })
    );
    res.sendStatus(202);
  });

  app.use((err, req, res, next) => {
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
