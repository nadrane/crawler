const NodeStatic = require("node-static");

module.exports = function(directory, port) {
  const file = new NodeStatic.Server(directory);

  return require("http")
    .createServer((request, response) => {
      request
        .addListener("end", () => {
          console.log("got request");
          file.serve(request, response);
        })
        .resume();
    })
    .listen(port, () => {
      console.log(`serving up toscrape from ${directory} at http://localhost:${port}`);
    });
};
