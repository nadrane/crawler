const fs = require("fs");

const requestLogs = fs.readFileSync("./logs/info.txt")
  .toString()
  .split("\n")
  .slice(0, -1)
  .map(line => JSON.parse(line))
  .filter(line => line.event === 'request sent');

const totalRequestsMade = requestLogs.length;
const firstDate = new Date(requestLogs[0].time)
const lastDate = new Date(requestLogs[totalRequestsMade - 1].time)
const elapsedSeconds = lastDate.getMinutes() * 60 + lastDate.getSeconds() - (firstDate.getMinutes() * 60 + firstDate.getSeconds());

console.log('requests per minute', totalRequestsMade, elapsedSeconds, (totalRequestsMade/elapsedSeconds) * 60)