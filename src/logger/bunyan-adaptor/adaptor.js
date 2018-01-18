const Bunyan = require("bunyan");
const { isTest } = require("APP/env/");

const bunyanFactory = logStream => outputFile => {
  const streams = [
    {
      level: "error",
      stream: process.stdout
    }
  ];

  if (!isTest() && outputFile) {
    streams.push({
      level: "info",
      path: outputFile
    });
  }

  const bunyanLogger = new Bunyan({
    name: "crawler",
    streams,
    serializers: Bunyan.stdSerializers
  });

  if (!isTest()) {
    bunyanLogger.addStream({
      name: "stats server",
      stream: logStream,
      level: "debug"
    });
  }

  return bunyanLogger;
};

module.exports = bunyanFactory;
