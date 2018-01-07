const { expect } = require("chai");
const makeBFloomFilterClient = require("APP/src/bloom-filter/client/");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

describe("Bloom Filter", () => {
  describe("client", () => {
    it("is possible to create a client", () => {
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      const client = makeBFloomFilterClient(logger, "127.0.0.1");

      expect(client).to.haveOwnProperty("set");
      expect(client).to.haveOwnProperty("check");
      expect(client).to.haveOwnProperty("drop");
      expect(client).to.haveOwnProperty("create");
    });
  });
});
