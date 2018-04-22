const Events = require("events");
const axios = require("axios");
const { expect } = require("chai");
const Logger = require("APP/src/logger");

describe("Logger", () => {
  it("should create the logger without error", () => {
    const logger = Logger(new Events(), axios, {
      statServerHost: "fake url",
      statServerPort: 80,
      outputFile: "fake file.txt"
    });
    expect(logger).to.be.a("object");
    expect(logger).to.be.a.property("unexpectedError");
  });
});
