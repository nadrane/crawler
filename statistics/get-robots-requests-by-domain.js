const fs = require("fs");
const {parse} = require('tldjs');

fs.readFile("./logs/info.txt", function(err, data) {
  console.log(
    "data",
    data
      .toString()
      .split("\n")
      .slice(0, -1)
      .map(line => JSON.parse(line))
      .filter(line => line.event === 'robots request sent')
      .reduce((domainCounts, log) => {
        const {domain} = parse(log.url)
        return domainCounts.concat(domain)
      },[])
      .sort()
      //   if (domain in domainCounts) {
      //     domainCounts[domain]++
      //   } else {
      //     domainCounts[domain] = 1
      //   }
      //   return domainCounts
      // }, {})
  );
});
