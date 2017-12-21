const readLog = require("./utils");

const responseError = readLog().filter(line => line.event === "response error");

console.log(responseError);
