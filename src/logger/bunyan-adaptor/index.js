const Bunyan = require("bunyan");
const LogStream = require("./log-stream");

const bunyanFactory = ({ url, http, outputFile }) => {
  const streams = [
    {
      level: "fatal",
      stream: process.stdout
    }
  ];

  if (url && http) {
    const logStream = new LogStream(url, http);
    streams.push({
      name: "stats server",
      stream: logStream,
      level: "debug"
    });
  }

  if (outputFile) {
    streams.push({
      level: "debug",
      path: outputFile
    });
  }

  const bunyanLogger = new Bunyan({
    name: "crawler",
    streams,
    serializers: Bunyan.stdSerializers
  });

  return bunyanLogger;
};

module.exports = bunyanFactory;
