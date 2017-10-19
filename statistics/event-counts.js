const readLog = require("./utils");
const requestsByDomain = readLog()

const eventCounts = readLog()
      .reduce((counts, log) => {
        const event = log.event
        if (event in counts) {
          counts[event]++
        } else {
          counts[event] = 1
        }
        return counts
      }, {})

console.log(eventCounts)