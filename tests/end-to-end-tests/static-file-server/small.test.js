const { chai } = require("chai");

const startStaticFileServer = require("./index");
const makeLogger = require("APP/src/logger/");
const Crawler = require("APP/src/main/child-process");
const http = require("axios");
const fs = require("fs");

describe("end to end - small", () => {
  const options = {};
  let logger;
  let staticFileServer;

  before(() => {
    staticFileServer = startStaticFileServer("index.books.toscrape.com");
    logger = makeLogger();
    options.exclude = {
      robots: true,
      bloomFilter: true
    };
  });

  after(() => {
    staticFileServer.close();
  });

  it("finds all of the links on the inputted page", () => {
    const crawler = new Crawler(["http://localhost:3333"], { logger, storage: fs, http });
    crawler.start();
  });
});
