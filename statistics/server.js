const express = require("express");
const bodyParser = require("body-parser");
const ndjson = require("ndjson");

const app = express();
app.use(bodyParser.json());

const stats = {};

app.post("/log", (req, res) => {
  req.pipe(ndjson.parse()).on("data", line => {
    const { event, domain, hostname } = line;
    if (!stats.hasOwnProperty(hostname)) {
      stats[hostname] = {};
    }
    if (!stats[hostname].hasOwnProperty(domain)) {
      stats[hostname][domain] = {};
    }
    if (!stats[hostname][domain].hasOwnProperty(event)) {
      stats[hostname][domain][event] = 0;
    }
    stats[hostname][domain][event] += 1;
  });
});

app.get("/log", (req, res) => {
  res.send(stats);
});
app.use((err, req, res, next) => {
  res.status(500);
  res.send(err);
});

app.listen(8080, () => {
  console.log("stats server starting");
});
