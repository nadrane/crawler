const Bunyan = require("bunyan");
const LogEntries = require("le_node");

const { isDev, LOGENTRIES_TOKEN_PROMISE } = require("../../env");

function bunyanFactory(outputFile) {
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

  LOGENTRIES_TOKEN_PROMISE.then(token => {
    bunyanLogger.addStream(LogEntries.bunyanStream({ token }));
  }).catch(err => {
    throw new Error("logentries token not found");
    process.exit();
  });

  return bunyanLogger
}

module.exports = bunyanFactory;
