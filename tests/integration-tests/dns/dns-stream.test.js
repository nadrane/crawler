const dns = require("dns");
const { promisify } = require("util");
const makeDnsStream = require("APP/src/dns/");
const makeLogger = require("APP/src/logger/");
const { expect } = require("chai");

dns.resolve = promisify(dns.resolve);

describe("dns stream", () => {
  const logger = makeLogger();

  it("outputs a url with it's hostname as an ipaddress address", () => {
    const url = ["http://google.com/search"];
    const dnsStream = makeDnsStream(logger, dns, 1);
    dnsStream.write(url);

    return new Promise((resolve, reject) => {
      dnsStream.on("data", urlWithIpAddress => {
        const ipAddressRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        try {
          expect(ipAddressRegex.test(urlWithIpAddress)).to.be.true;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
