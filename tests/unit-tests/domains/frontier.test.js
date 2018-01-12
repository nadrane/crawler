const path = require("path");
const sinon = require("sinon");
const { expect } = require("chai");
const Frontier = require("APP/src/domains/frontier");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

describe("Frontier", () => {
  const storage = {
    writeFileSync: () => Promise.resolve()
  };
  let eventCoordinator;
  let logger;
  let frontier;

  beforeEach(() => {
    eventCoordinator = new Events();
    logger = makeLogger(eventCoordinator);
    frontier = new Frontier("google.com", logger, storage);

    sinon.stub(logger);
  });

  describe("constructor", () => {
    it("sets the filename equal to the frontier directory plus the name of the domain", () => {
      const expectedFilename = path.join(FRONTIER_DIRECTORY, "google.com.txt");

      expect(frontier.fileName).to.equal(expectedFilename);
    });

    it("when setting file names, it disregards the protocol, if included", () => {
      frontier = new Frontier("http://google.com", logger, storage);
      const expectedFilename = path.join(FRONTIER_DIRECTORY, "google.com.txt");

      expect(frontier.fileName).to.equal(expectedFilename);
    });
  });

  describe("isEmpty", () => {
    it("should return false when the frontier is not empty", () => {
      expect(frontier.isEmpty()).to.be.false;
    });

    it("should return true when the frontier is empty", () => {
      frontier.urlsInFrontier = 0;
      expect(frontier.isEmpty()).to.be.true;
    });
  });

  describe("readyForReading", () => {
    it("should be ready for reading upon creation", () => {
      expect(frontier.readyForReading()).to.be.true;
    });

    it("should not be ready for reading when the frontier is empty", () => {
      frontier.urlsInFrontier = 0;
      expect(frontier.readyForReading()).to.be.false;
    });

    it("should not be ready for reading when the currently reading flag is set", () => {
      frontier.currentlyReading = true;
      expect(frontier.readyForReading()).to.be.false;

      frontier.urlsInFrontier = 10;
      expect(frontier.readyForReading()).to.be.false;
    });
  });

  describe("append", () => {
    it("queues up a link to add to the frontier", () => {
      frontier.append("www.yahoo.com");
      expect(frontier.queuedNewlinks).lengthOf(1);
    });

    it("calls flushNewLinkQueue after one minute", () => {
      const clock = sinon.useFakeTimers();
      const newLinkQueueSpy = sinon.spy(frontier, "flushNewLinkQueue");
      frontier.append("www.yahoo.com");

      const oneMinute = 60 * 1000;
      clock.tick(oneMinute - 1);
      expect(newLinkQueueSpy.notCalled).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;

      clock.restore();
    });

    it("does not schedule flushNewLinkQueue multiple times given multiple calls within one minute", () => {
      const clock = sinon.useFakeTimers();
      const newLinkQueueSpy = sinon.spy(frontier, "flushNewLinkQueue");
      frontier.append("www.yahoo.com");
      frontier.append("www.microsoft.com");

      const oneMinute = 60 * 1000;
      clock.tick(oneMinute - 1);
      expect(newLinkQueueSpy.notCalled).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;

      clock.restore();
    });
  });

  describe("flushNewLinkQueue", () => {
    let flushLinkQueue;
    let clock;

    beforeEach(() => {
      flushLinkQueue = sinon.spy(frontier, "flushNewLinkQueue");
      clock = sinon.useFakeTimers();
      frontier.flushScheduled = true;
      frontier.queuedNewlinks = ["www.microsoft.com", "www.yahoo.com"];
    });

    afterEach(() => {
      clock.restore();
      flushLinkQueue.restore();
    });

    it("if a read is in progress, it reschedules to flush operation for 5 seconds in the future", async () => {
      frontier.currentlyReading = true;
      await frontier.flushNewLinkQueue();

      const fiveSeconds = 5 * 1000;
      clock.tick(fiveSeconds - 1);
      expect(flushLinkQueue.calledOnce).to.be.true;
      clock.tick(1);
      expect(flushLinkQueue.calledTwice).to.be.true;
    });

    it("if a read is in not progress, it does not schedule another flush operation", async () => {
      frontier.currentlyReading = false;
      await frontier.flushNewLinkQueue();

      const fiveSeconds = 5 * 1000;
      clock.tick(fiveSeconds - 1);
      expect(flushLinkQueue.calledOnce).to.be.true;
      clock.tick(1);
      expect(flushLinkQueue.calledTwice).to.be.false;
    });

    it("appends the queued links to the frontier file", async () => {
      frontier.currentlyReading = false;
      storage.appendFileAsync = sinon.spy();

      await frontier.flushNewLinkQueue();

      expect(storage.appendFileAsync.calledOnce).to.be.true;
      expect(
        storage.appendFileAsync.calledWithExactly(
          frontier.fileName,
          "www.microsoft.com\nwww.yahoo.com\n"
        )
      ).to.be.true;
      expect(frontier.urlsInFrontier).to.equal(3);
      expect(frontier.flushScheduled).to.be.false;
      expect(frontier.currentlyReading).to.be.false;
      expect(frontier.queuedNewlinks).to.be.empty;
    });

    it("does not change the state of the frontier if the append fails", async () => {
      frontier.currentlyReading = false;
      storage.appendFileAsync = sinon.stub().returns(Promise.reject());

      await frontier.flushNewLinkQueue();

      expect(storage.appendFileAsync.calledOnce).to.be.true;
      expect(frontier.urlsInFrontier).to.equal(1);
      expect(frontier.flushScheduled).to.be.false;
      expect(frontier.currentlyReading).to.be.false;
      expect(frontier.queuedNewlinks).to.deep.equal(["www.microsoft.com", "www.yahoo.com"]);
    });
  });

  describe("getNextUrl", () => {
    it("returns the frontier urls in order, never repeating itself", async () => {
      const frontierUrls = "www.bing.com\nwww.bing.com/link1\nwww.bing.com/link2";
      storage.readFileAsync = sinon.stub().returns(frontierUrls);
      frontier.urlsInFrontier = 3;

      expect(await frontier.getNextUrl()).to.equal("www.bing.com");
      expect(frontier.urlsInFrontier).to.equal(2);
      expect(await frontier.getNextUrl()).to.equal("www.bing.com/link1");
      expect(frontier.urlsInFrontier).to.equal(1);
      expect(await frontier.getNextUrl()).to.equal("www.bing.com/link2");
      expect(frontier.urlsInFrontier).to.equal(0);
    });

    it("returns an empty string if the frontier is empty", async () => {
      frontier.urlsInFrontier = 0;
      expect(await frontier.getNextUrl()).to.equal("");
    });

    it("currentlyReading is false after successfully returning", async () => {
      storage.readFileAsync = sinon.stub().returns("www.bing.com");

      await frontier.getNextUrl();
      expect(frontier.currentlyReading).to.be.false;
    });

    it("currentlyReading is false after reading throws an error", async () => {
      storage.readFileAsync = sinon.stub().returns(Promise.reject());

      await frontier.getNextUrl();
      expect(frontier.currentlyReading).to.be.false;
    });

    it("does not change the number of urls in the frontier if the read fails", async () => {
      storage.readFileAsync = sinon.stub().returns(Promise.reject());

      expect(frontier.urlsInFrontier).to.equal(1);
      await frontier.getNextUrl();
      expect(frontier.urlsInFrontier).to.equal(1);
    });
  });
});
