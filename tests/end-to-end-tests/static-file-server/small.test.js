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
const { FRONTIER_DIRECTORY } = require("APP/env/");
const rimraf = require("rimraf");
const makeLogger = require("APP/src/logger/");
const makeCrawler = require("APP/src/main/child-process");
const path = require("path");
const express = require("express");

const port = 8989;

// staticFileServer = startStaticFileServer(path.join(__dirname, "index.books.toscrape.com"), port);
describe("end to end - small", () => {
  let logger;
  let server;
  let crawler;

  before(async () => {
    const app = express();
    server = http.createServer(app);
    app.use(express.static(path.join(__dirname, "./index.books.toscrape.com")));
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
        bloomFilterUrl: "127.0.0.1"
      }
    );
  });

  after(() => {
    crawler.stop();
    server.close();
  });

  it("finds all of the links on the inputted page", async () => {
    crawler.start();

    return new Promise(resolve => {
      crawler.on("flushedLinkQueue", ({ count }) => {
        console.log("link queue at test level", count);
        if (count === 73) {
          resolve();
        }
      });
    });
  }).timeout(10000);
});
