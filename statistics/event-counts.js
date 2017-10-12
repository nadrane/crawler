const fs = require("fs");

fs.readFile("./logs/info.txt", function(err, data) {
  console.log(
    "data",
    data
      .toString()
      .split("\n")
      .slice(0, -1)
      .map(line => JSON.parse(line))
      .reduce((counts, log) => {
        const event = log.event
        if (event in counts) {
          counts[event]++
        } else {
          counts[event] = 0
        }
        return counts
      }, {})
  );
});
