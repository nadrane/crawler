const dns = require("dns");
const { promisify } = require("util");
const makeDnsStream = require("APP/src/dns/");
const makeLogger = require("APP/src/logger/");

dns.resolve = promisify(dns.resolve);

describe.only("dns stream", () => {
  const logger = makeLogger();

  it("outputs a url with it's hostnmae as an ipaddress address", () => {
    const url = ["http://google.com/search"];
    const dnsStream = makeDnsStream(logger, dns, 1);
    dnsStream.write(url);

    return new Promise((resolve, reject) => {
      dnsStream.on("data", urlWithIpAddress => {
        const expectedUrl = "http://172.217.9.78/search";
        if (urlWithIpAddress === expectedUrl) {
          resolve();
        }
        reject(new Error(`incorrect url returned. Expected ${urlWithIpAddress} to equal ${expectedUrl}`));
      });
    });
  });
});
