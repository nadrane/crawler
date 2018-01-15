const express = require("express");
const bodyParser = require("body-parser");
const ndjson = require("ndjson");
const { isDev, isProd } = require("APP/env/");

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
    const { event, domain, hostname, codeModule, err } = line;

    if (err) {
      errors.push(err);
    }
    if (hostname && !stats.hasOwnProperty(hostname)) {
      stats[hostname] = {};
      stats[hostname].totalEvents = 0;
    }

    if (codeModule && !stats[hostname].hasOwnProperty(codeModule)) {
      stats[hostname][codeModule] = {};
      stats[hostname][codeModule].totalEvents = 0;
    }

    if (event && codeModule && !stats[hostname][codeModule].hasOwnProperty(event)) {
      stats[hostname][codeModule][event] = 0;
    }

    if (domain && !stats.hasOwnProperty(domain)) {
      stats[domain] = {};
      stats[domain].totalEvents = 0;
    }
    if (event && domain && !stats[domain].hasOwnProperty(event)) {
      stats[domain][event] = 0;
    }

    if (domain) {
      stats[domain][event] += 1;
      stats[domain].totalEvents += 1;
    }

    if (codeModule) {
      stats[hostname][codeModule][event] += 1;
      stats[hostname][codeModule].totalEvents += 1;
      stats[hostname].totalEvents += 1;
    }

    if (event === "request sent") {
      totalRequests += 1;
    }
  });
  res.sendStatus(200);
});

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
