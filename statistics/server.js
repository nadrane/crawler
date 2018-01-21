const path = require("path");
const express = require("express");
const mkdirp = require("mkdirp");
const { createWriteStream } = require("fs");
const { LOGGING_DIR } = require("../env/");

const statsPath = path.join(LOGGING_DIR, "stats");
const statsFile = path.join(statsPath, Date.now());
mkdirp(statsPath);

module.exports = function makeServer() {
  const app = express();

  app.post("/log", (req, res) => {
    req.pipe(createWriteStream(statsFile));

    res.sendStatus(202);
  });

  app.use((err, req, res, next) => {
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
