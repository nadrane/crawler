const http = require("http");

const axios = require("axios");
// const options = {
//   hostname: 'www.google.com',
//   port: 80,
//   path: '/',
//   method: 'GET',
// };

// const req  = http.request(options, res => {
//   // res.setEncoding('utf8');
//   res.on('data', (chunk) => {
//   });
//   res.on('end', () => {
//     console.log('No more data in response.');
//   });
//   res.on("close", () => {
//     console.log("closing!");
//   });
// });

// req.end()

console.log("requesting");
axios({
  method: "get",
  url: "http://localhost:8080/log",
  timeout: 1
})
  .then(res => console.log("res", res.request))
  .catch(res => {
    console.log(res);
  });
