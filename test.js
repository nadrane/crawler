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



const req = axios
  .post(
    "http://ec2-54-198-128-220.compute-1.amazonaws.com/log",
    { dsfdsfdsfdsfhjdsfhdsgvfhgdvsfghvdsfgvdshgfsdghvf: Buffer.alloc(1000 * 1000 * 3) },
  )
  .then(res => console.log("res", res.request));

console.log("request headers", req);
