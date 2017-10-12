const fs = require("fs");

fs.readFile("./logs/info.txt", function(err, data) {
  console.log(
    "data",
    data
      .toString()
      .split("\n")
      .slice(0, -1)
      .map(line => JSON.parse(line))
      .filter(line => line.event === "new link")
      .map(line => line.newUrl)
      .map(line => line.length)
      .reduce((avg, line, idx, arr) => {
        if (idx === arr.length - 1) {
          return (line + avg) / arr.length
        } else {
          return line + avg
        }
      },0)
  );
});
