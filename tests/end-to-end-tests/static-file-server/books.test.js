const tldjs = require("tldjs");

tldjs.getDomain = function(domain) {
  if (domain.startsWith("http://localhost")) {
    return `localhost:${port}`;
  }
  return tldjs.getDomain(domain);
};

const fs = require("fs");
const axios = require("axios");
const http = require("http");
const { expect } = require("chai");
const rimraf = require("rimraf");
const path = require("path");
const express = require("express");

const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeCrawler = require("APP/src/main/child-process");
const makeLogger = require("APP/src/logger/");
const findUniqueLinksInFolder = require("./findUniqueLinksInFolder");

const port = 8989;

describe("end to end - books", () => {
  let logger;
  let server;
  let crawler;

  before(async () => {
    const app = express();
    server = http.createServer(app);
    app.use(express.static(path.join(__dirname, "./books.toscrape.com")));
    server.listen(port);
    rimraf.sync(FRONTIER_DIRECTORY);
    logger = makeLogger();
    crawler = await makeCrawler(
      [`http://localhost:${port}`],
      {
        logger,
        storage: fs,
        http: axios
      },
      {
        exclude: { robots: true },
        bloomFilterUrl: "127.0.0.1",
        maxConcurrency: 100
      }
    );
  });

  after(() => {
    crawler.stop();
    server.close();
  });

  it("finds all of the links on the inputted page", async () => {
    crawler.start();
    const expectedLinkCount = await findUniqueLinksInFolder("books.toscrape.com");
    console.log("e", expectedLinkCount);

    return new Promise(resolve => {
      crawler.on("flushedLinkQueue", () => {
        console.log("total", crawler.totalLinksFound);
        if (crawler.totalLinksFound === expectedLinkCount) {
          resolve();
        }
      });
    });
  }).timeout(110 * 1000);
});
