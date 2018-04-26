const { readFile } = require("fs");
const { promisify } = require("util");
const path = require("path");
const { URL } = require("url");
const klaw = require("klaw");

const readFileAsync = promisify(readFile);

module.exports = function findUniqueLinksInFolder(folder) {
  const matchLink = /<a href="(.*?)"/g;
  const allLinks = new Set();
  const filePromises = [];
  if (!folder.startsWith(__dirname)) {
    folder = path.join(__dirname, "books.toscrape.com");
  }

  return new Promise((resolve, reject) => {
    klaw(folder)
      .on("data", item => {
        if (!item.path.endsWith(".html")) return;

        const filePromise = readFileAsync(item.path).then(buffer => {
          const str = buffer.toString();
          let nextMatch = matchLink.exec(str);
          let baseUrl = item.path.split("/nicholasdrane/projects/crawler/tests/end-to-end-tests/static-file-server/")[1];
          baseUrl = `http://${baseUrl}`;
          while (nextMatch) {
            try {
              const nextUrl = new URL(nextMatch[1], baseUrl).toString();
              // There are some links in /reviews in html comments that the scraper will ignore/
              // We should ignore them here too
              if (!nextUrl.endsWith("/reviews/")) {
                allLinks.add(nextUrl);
              }
            } catch (err) {
              reject(err);
            }
            nextMatch = matchLink.exec(str);
          }
        });

        filePromises.push(filePromise);
      })
      .on("end", () => {
        Promise.all(filePromises).then(() => {
          resolve(allLinks.size);
        });
      });
  });
};
