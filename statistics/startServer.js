const makeServer = require("./server");

const hostname = process.argv[2];
const port = process.argv[3];

process.title = "crawler - statistics";

startServer(hostname, port);

function startServer(port = 8080, hostname = "localhost") {
  const app = makeServer();
  app.listen(hostname, port, () => {
    console.log(`stats server starting at ${hostname} on port ${port}`);
  });
}
