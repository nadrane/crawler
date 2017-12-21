const fs = require("fs");
const path = require("path");

const { LOGGING_DIR } = require("../env");

function readAndParseMostRecentLog() {
  // const logFiles = fs.readdirSync(LOGGING_DIR)

  // const sortByRecency = logs => logs.sort((a, b) => {
  //   const stripConnectionString = fileName => fileName.slice(fileName.indexOf('c') + 1)
  //   return new Date(stripConnectionString(a)) > new Date(stripConnectionString(b))
  // })

  // const mostRecentLog = sortByRecency(logFiles)[logFiles.length - 1]
  requestLogs = fs.readFileSync(path.join(LOGGING_DIR, "logs.txt"));
  console.log(requestLogs.toString());
  // .toString()
  // .split("\n")
  // .slice(0, -1)
  // .map(line => JSON.parse(line))
}
module.exports = readAndParseMostRecentLog;
