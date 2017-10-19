const readLog = require('./utils');
const requestLogs = readLog().filter(line => line.event === 'request sent')

const totalRequestsMade = requestLogs.length;
const firstDate = new Date(requestLogs[0].time)
const lastDate = new Date(requestLogs[totalRequestsMade - 1].time)
const elapsedSeconds = lastDate.getMinutes() * 60 + lastDate.getSeconds() - (firstDate.getMinutes() * 60 + firstDate.getSeconds());

console.log('requests made', totalRequestsMade)
console.log('elapsed seconds', elapsedSeconds)
console.log('requests per minute', (totalRequestsMade/elapsedSeconds) * 60)