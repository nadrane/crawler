const app = require("./server");

const hostname = process.argv[2];
const port = process.argv[3];

startServer(hostname, port);

function startServer(port = 8080, hostname = "localhost") {
  app.listen(hostname, port, () => {
    console.log(`stats server starting at ${hostname} on port ${port}`);
  });
}
