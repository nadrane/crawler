const Bunyan = require("bunyan");

const bunyanFactory = logStream => outputFile => {
  const streams = [
    {
      level: "error",
      stream: process.stdout
    }
  ];

  if (outputFile) {
    streams.push({
      level: "info",
      path: outputFile
    });
  }

  const bunyanLogger = new Bunyan({
    name: "crawler",
    streams
  });

  bunyanLogger.addStream({
    name: "stats server",
    stream: logStream,
    level: "debug"
  });

  return bunyanLogger;
};

module.exports = bunyanFactory;
