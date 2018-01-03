const { expect } = require("chai");
const { promisify } = require("util");
const path = require("path");
const rimraf = promisify(require("rimraf"));
const Frontier = require("APP/src/domains/frontier");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const { readFileSync } = require("fs");

describe("Frontier", () => {
  beforeEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });
  afterEach(async () => {
    await rimraf(`${FRONTIER_DIRECTORY}/*`);
  });

  describe("constructor", () => {
    it("creates a frontier file with the expected url", () => {
      const frontier = new Frontier("google.com");

      const expectedFilePath = path.join(FRONTIER_DIRECTORY, "google.com.txt");
      expect(readFileSync(expectedFilePath).toString()).to.equal("http://google.com\n");
    });
  });
  describe("flushNewLinkQueue", () => {
    it("adds the new link queue to the frontier", async () => {
      const frontier = new Frontier("google.com");
      frontier.append("www.google.com/search");
      frontier.append("google.com/link1");
      frontier.append("www.google.com/link2");
      await frontier.flushNewLinkQueue();

      const expectedFilePath = path.join(FRONTIER_DIRECTORY, "google.com.txt");
      expect(readFileSync(expectedFilePath).toString()).to.equal("http://google.com\nwww.google.com/search\ngoogle.com/link1\nwww.google.com/link2\n");
    });
  });
});
