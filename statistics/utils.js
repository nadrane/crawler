const fs = require("fs");
const path = require('path');

const { LOGGING_DIR } = require('../env')

function readAndParseMostRecentLog() {
  const logFiles = fs.readdirSync(LOGGING_DIR)

  const sortByRecency = logs => logs.sort((a, b) => new Date(a.slice(3)) > new Date(b.slice(3)))

  const mostRecentLog = sortByRecency(logFiles)[logFiles.length - 1]
  return requestLogs = fs.readFileSync(path.join(LOGGING_DIR, mostRecentLog))
    .toString()
    .split("\n")
    .slice(0, -1)
    .map(line => JSON.parse(line))
}
module.exports = readAndParseMostRecentLog