const Bunyan = require("bunyan");
const LogEntries = require("le_node");

const { isDev, LOGENTRIES_TOKEN_PROMISE } = require("../../env");

const bunyanLogger = new Bunyan({
  name: "crawler",
  streams: [
    {
      level: "error",
      stream: process.stdout
    }
  ]
});

LOGENTRIES_TOKEN_PROMISE
  .then(token => {
    bunyanLogger.addStream(LogEntries.bunyanStream({ token }));
  })
  .catch(err => {
    throw new Error("logentries token not found");
    process.exit();
  });


module.exports = bunyanLogger;
