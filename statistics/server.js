const express = require("express");
const bodyParser = require("body-parser");
const ndjson = require("ndjson");

const app = express();
app.use(bodyParser.json());

const stats = {};
const errors = [];
const requestsPerMinuteLog = [];
let totalRequests = 0;

setInterval(() => {
  if (requestsPerMinuteLog.length === 0) {
    requestsPerMinuteLog.push(totalRequests);
  } else {
    requestsPerMinuteLog.push(
      totalRequests - requestsPerMinuteLog.reduce((accum, next) => accum + next, 0)
    );
  }
}, 1000 * 60);

app.post("/log", (req, res) => {
  req.pipe(ndjson.parse()).on("data", line => {
    const { event, domain, subdomain, codeModule, err } = line;
    const machine = line.hostname;

    trackErrors(err);
    trackMachineLevelEvents(machine, codeModule, event);
    trackDomainLevelEvents(domain, subdomain, event);
    trackSystemLevelEvents(event);
  });
  res.sendStatus(200);
});

function trackErrors(err) {
  if (!err) return;

  errors.push(err);
}

function trackMachineLevelEvents(machine, codeModule, event) {
  if (!machine || !codeModule || !event) {
    return;
  }

  if (!stats.hasOwnProperty(machine)) {
    stats[machine] = {};
    stats[machine].totalEvents = 0;
  }

  if (!stats[machine].hasOwnProperty(codeModule)) {
    stats[machine][codeModule] = {};
    stats[machine][codeModule].totalEvents = 0;
  }

  if (!stats[machine][codeModule].hasOwnProperty(event)) {
    stats[machine][codeModule][event] = 0;
  }

  stats[machine][codeModule][event] += 1;
  stats[machine][codeModule].totalEvents += 1;
  stats[machine].totalEvents += 1;
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

function trackSystemLevelEvents(event) {
  if (!event) return;

  if (event === "request sent") {
    totalRequests += 1;
  }
}

app.get("/log", (req, res) => {
  res.send({
    errors,
    currentRPM: requestsPerMinuteLog.length
      ? requestsPerMinuteLog[requestsPerMinuteLog.length - 1]
      : totalRequests,
    RPM: requestsPerMinuteLog,
    totalRequests,
    stats
  });
});
app.use((err, req, res, next) => {
  res.status(500);
  res.send(err);
});

module.exports = app;
