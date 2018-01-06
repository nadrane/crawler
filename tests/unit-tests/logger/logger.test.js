const Events = require("events");
const axios = require("axios");
const { expect } = require("chai");
const Logger = require("APP/src/logger");

describe("Logger", () => {
  it("should create the logger without error", () => {
    const eventCoordinator = new Events();
    const logger = new Logger(eventCoordinator, axios, "fake url", "fake file.txt");
    expect(logger).to.be.a("object");
    expect(logger).to.be.a.property("unexpectedError");
  });
});
