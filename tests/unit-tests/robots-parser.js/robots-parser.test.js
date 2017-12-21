// const sinon = require("sinon");
// const mocha = require("mocha");
// const { expect } = require("chai");
// const domainFactory = require("APP/src/robots-parser");
// const sandbox = sinon.createSandbox();

// describe("robots-parser", () => {
//   describe("isAllowed", () => {
//     it('should return return cached values given an identical protocol/port/hostname combination', () => {
//       const domainsPromise = Promise.resolve(Buffer.from("www.google.com\nwww.yahoo.com\nwww.bing.com"));
//       const domains = await domainFactory(domainsPromise);

//       expect(domains.getDomainToScrape()).to.equal('www.google.com')
//       expect(domains.getDomainToScrape()).to.equal('www.yahoo.com')
//       expect(domains.getDomainToScrape()).to.equal('www.bing.com')
//     })

//   })
// });
