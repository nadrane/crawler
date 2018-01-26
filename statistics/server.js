const path = require("path");
const express = require("express");
const mkdirp = require("mkdirp");
const { createWriteStream } = require("fs");
const { LOGGING_DIR } = require("../env/");

module.exports = function makeServer() {
  const logFile = path.join(LOGGING_DIR, Date.now().toString());
  mkdirp(LOGGING_DIR);
  const app = express();

  app.post("/log", (req, res) => {
    req.pipe(createWriteStream(logFile, { flags: "a" })).on("error", err => {
      console.log(err);
    });
    req.on("end", () => {
      res.send({ logFile });
    });
  });

  app.use((err, req, res, next) => {
    console.log("errdsfdsf");
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
