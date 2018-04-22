const NodeStatic = require("node-static");

module.exports = function(directory) {
  const file = new NodeStatic.Server(directory);

  return require("http")
    .createServer((request, response) => {
      request
        .addListener("end", () => {
          file.serve(request, response);
        })
        .resume();
    })
    .listen(3333, () => {
      console.log("serving toscrape.com from http://localhost:3333");
    });
};
