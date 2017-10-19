const readLog = require("./utils");
const enexpectedErrors = readLog().filter(line => line.event === "unexpected error");

console.log(enexpectedErrors);
