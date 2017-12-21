const readLog = require("./utils");

const enexpectedErrors = readLog().filter(line => line.level === 50);

console.log(enexpectedErrors);
