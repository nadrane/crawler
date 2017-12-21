const readLog = require("./utils");

const requestsByDomain = readLog()
  .filter(line => line.event === "request sent")
  .reduce((domainCounts, log) => {
    const { domain } = log;
    if (domain in domainCounts) {
      domainCounts[domain]++;
    } else {
      domainCounts[domain] = 1;
    }
    return domainCounts;
  }, {});

console.log(requestsByDomain);
