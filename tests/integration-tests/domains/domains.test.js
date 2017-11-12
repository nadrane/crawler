const mocha = require("mocha");
const { expect } = require("chai");
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const { FRONTIER_DIRECTORY } = require('APP/env/')

describe("Domains", () => {
  let domains;
  beforeEach(async () => {
    await rimraf(FRONTIER_DIRECTORY + '/*')
    domains = await require('APP/src/domains');
  });
  afterEach(async () => {
    await rimraf(FRONTIER_DIRECTORY + '/*')
  });

  describe("getNextUrlToScrape", async () => {
    it('returns a sequence of different urls from the seed file', async () =>{
      expect(await domains.getNextUrlToScrape()).to.equal('http://google.com')
      expect(await domains.getNextUrlToScrape()).to.equal('http://youtube.com')
      expect(await domains.getNextUrlToScrape()).to.equal('http://facebook.com')
    })
  })
})