const express = require("express");
const bodyParser = require("body-parser");
const ndjson = require("ndjson");

const app = express();
app.use(bodyParser.json());

const stats = {};

app.post("/log", (req, res) => {
  console.log('got it')
  req.pipe(ndjson.parse()).on("data", line => {
    const { event, domain, hostname } = line;
    if (!stats.hasOwnProperty(hostname)) {
      stats[hostname] = {};
      stats[hostname].total = 0;
    }
    if (!stats[hostname].hasOwnProperty(domain)) {
      stats[hostname][domain] = {};
      stats[hostname][domain] = 0;
    }
    if (!stats[hostname][domain].hasOwnProperty(event)) {
      stats[hostname][domain][event] = 0;
    }
    if (event === "request sent") {
      stats[hostname].total += 1;
      stats[hostname][domain].total += 1;
    }
  });
  res.sendStatus(200);
});

app.get("/log", (req, res) => {
  res.send(stats);
});
app.use((err, req, res, next) => {
  res.status(500);
  res.send(err);
});

app.listen(80, "0.0.0.0", () => {
  console.log("stats server starting");
});
