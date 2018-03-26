const path = require("path");
const express = require("express");
const mkdirp = require("mkdirp");
const { createWriteStream, writeFileSync } = require("fs");
const os = require("os");
const env = require("../env/");

const { LOGGING_DIR } = env;

module.exports = function makeServer() {
  const logFile = path.join(LOGGING_DIR, Date.now().toString());
  mkdirp(LOGGING_DIR);
  try {
    writeFileSync(logFile, `${JSON.stringify(Object.assign({ hostname: os.hostname() }, env))}\n`);
  } catch (err) {
    console.error("failed to start stat server - could not initialize log file");
    throw err;
  }

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
    console.log("stat server error");
    res.status(500);
    res.send({ message: err.message, stack: err.stack });
  });

  return app;
};
