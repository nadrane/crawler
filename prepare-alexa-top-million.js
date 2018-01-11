const fs = require("fs");
const { getDomain } = require("tldjs");

const urls = fs
  .readFileSync("alexa-top-million.csv")
  .toString()
  .split("\n")
  .map(line => line.split(",")[1])
  .map(getDomain)
  .filter(domain => !!domain);

const uniqueUrls = [...new Set(urls)];

fs.writeFileSync("seed.json", JSON.stringify(uniqueUrls));
