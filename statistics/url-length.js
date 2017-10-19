const readLog = require('./utils');

const averageUrlLength = readLog()
.filter(line => line.event === 'new link')
.map(line => line.newUrl.length)
.reduce((avg, line, idx, arr) => {
  if (idx === arr.length - 1) {
    return (line + avg) / arr.length
  } else {
    return line + avg
  }
}, 0)

console.log(averageUrlLength)