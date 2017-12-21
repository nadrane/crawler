const { parse } = require("tldjs");

const readLog = require("./utils");

const robotsRequests = readLog()
  .filter(line => line.event === "robots request sent")
  .map(line => line.hostname)
  .reduce((domainCounts, hostname) => {
    const { domain } = parse(hostname);
    if (domain in domainCounts) {
      domainCounts[domain]++;
    } else {
      domainCounts[domain] = 1;
    }
    return domainCounts;
  }, {});

console.log(robotsRequests);
