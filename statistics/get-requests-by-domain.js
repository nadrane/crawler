const fs = require("fs");

fs.readFile("./logs/info.txt", function(err, data) {
  console.log(
    "data",
    data
      .toString()
      .split("\n")
      .slice(0, -1)
      .map(line => JSON.parse(line))
      .filter(line => line.event === 'request sent')
      .reduce((domainCounts, log) => {
        const domain = log.domain
        if (domain in domainCounts) {
          domainCounts[domain]++
        } else {
          domainCounts[domain] = 1
        }
        return domainCounts
      }, {})
  );
});
