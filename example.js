const throughConcurrent = require("through2-concurrent");
const fs = require("fs");
const { promisify } = require("util");
const split = require("split");

const writeFileAsync = promisify(fs.writeFile);

fs
  .createReadStream("infiniteList.txt")
  .pipe(split())
  .pipe(throughConcurrent.obj({ maxConcurrency: 5 }, async function(domain, enc, done) {
    try {
      console.log("invoking callback");
      const url = await sometimesAsyncFunction(domain);
      if (url) {
        this.push(url);
      }
    } catch (err) {
      console.error(err);
    }
    done();
  }));

let calledBefore = false;
async function sometimesAsyncFunction(domain) {
  if (calledBefore) {
    return "";
  }
  calledBefore = true;
  // This is a readFile in my code, but clearly I don't want to have to stub that out
  await writeFileAsync("123.txt", domain);
  console.log("async operation finished");
  const someUrl = "http://123.com";
  return someUrl;
}
