const Bunyan = require("bunyan");
const LogEntries = require('le_node');

const credentials = require('../../logentries-credentials')
const {isDev, isProd} = require('../../env')

let token;
if (isDev()) {
  token = credentials.DEV_TOKEN
} else if (isProd()) {
  token = credentials.PROD_TOKEN
} else {
  throw new Error("logentries token not found")
}

const bunyanLogger = new Bunyan({
  name: "crawler",
  streams: [
    LogEntries.bunyanStream({ token }),
    {
      level: "error",
      stream: process.stdout
    }
  ]
});

module.exports = bunyanLogger