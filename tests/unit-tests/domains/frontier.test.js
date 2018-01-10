const path = require("path");
const sinon = require("sinon");
const { expect } = require("chai");
const Frontier = require("APP/src/domains/frontier");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeLogger = require("APP/src/logger/");
const Events = require("events");

//QUESTION: Should I have just mocked out the file system to test this?
// As is, I don't really get the coverage I'd like
describe("Frontier", () => {
  const storage = {};
  beforeEach(() => {
    storage.writeFileSync = sinon.spy();
    storage.readFileAsync = sinon.spy();
    storage.writeFileAsync = sinon.spy();
    storage.appendFileAsync = sinon.spy();
  });
  describe("constructor", () => {
    it("sets the filename equal to the frontier directory plus the name of the domain", () => {
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      const frontier = new Frontier("google.com", logger, storage);
      const expectedFilename = path.join(FRONTIER_DIRECTORY, "google.com.txt");

      expect(frontier.fileName).to.equal(expectedFilename);
    });

    it("when setting file names, it disregards the protocol, if included", () => {
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      const frontier = new Frontier("http://google.com", logger, storage);
      const expectedFilename = path.join(FRONTIER_DIRECTORY, "google.com.txt");

      expect(frontier.fileName).to.equal(expectedFilename);
    });
  });

  describe("isEmpty", () => {
    it("should return false when the frontier is not empty", () => {
      const frontier = new Frontier("www.google.com", storage);
      expect(frontier.isEmpty()).to.be.false;
    });

    it("should return true when the frontier is empty", () => {
      const frontier = new Frontier("www.google.com", storage);
      frontier.urlsInFrontier = 0;
      expect(frontier.isEmpty()).to.be.true;
    });
  });

  //QUESTION How the heck should I test the currentlyReading flag??
  // setting it in test setup feels wrong
  describe("readyForReading", () => {
    it("should be ready for reading upon creation", () => {
      const frontier = new Frontier("www.google.com", storage);
      expect(frontier.readyForReading()).to.be.true;
    });

    it("should not be ready for reading when the frontier is empty", () => {
      const frontier = new Frontier("www.google.com", storage);
      frontier.urlsInFrontier = 0;
      expect(frontier.readyForReading()).to.be.false;
    });
  });

  describe("append", () => {
    it("queues up a link to add to the frontier", () => {
      const frontier = new Frontier("www.google.com", storage);
      frontier.append("www.yahoo.com");
      expect(frontier.queuedNewlinks).lengthOf(1);
    });

    it("calls flushNewLinkQueue after one minute", () => {
      const clock = sinon.useFakeTimers();
      const frontier = new Frontier("www.google.com", storage);
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
      const frontier = new Frontier("www.google.com", storage);
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
    let frontier, newLinkQueueSpy, clock;

    beforeEach(() => {
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      frontier = new Frontier("www.google.com", logger, storage);
      newLinkQueueSpy = sinon.spy(frontier, "flushNewLinkQueue");
      clock = sinon.useFakeTimers();
      frontier.flushScheduled = true;
      frontier.queuedNewlinks = ["www.microsoft.com", "www.yahoo.com"];
    });

    afterEach(() => {
      clock.restore();
      newLinkQueueSpy.restore();
    });

    it("if a read is in progress, it reschedules to flush operation for 5 seconds in the future", async () => {
      frontier.currentlyReading = true;
      await frontier.flushNewLinkQueue();

      const fiveSeconds = 5 * 1000;
      clock.tick(fiveSeconds - 1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledTwice).to.be.true;
    });

    it("if a read is in not progress, it does not schedule another flush operation", async () => {
      frontier.currentlyReading = false;
      await frontier.flushNewLinkQueue();

      const fiveSeconds = 5 * 1000;
      clock.tick(fiveSeconds - 1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledTwice).to.be.false;
    });

    it("appends the queued links to the frontier file", async () => {
      frontier.currentlyReading = false;
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
      expect(frontier.queuedNewlinks).to.be.empty;
    });
  });

  describe("getNextUrl", () => {
    it("returns the first url in the frontier", async () => {
      storage.writeFileAsync = sinon.stub().returns(Promise.resolve());
      storage.readFileAsync = sinon
        .stub()
        .returns("www.bing.com\nwww.bing.com/link1\nwww.bing.com/link2");
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      const frontier = new Frontier("www.bing.com", logger, storage);
      frontier.urlsInFrontier = 3;

      expect(await frontier.getNextUrl()).to.equal("www.bing.com");
      expect(frontier.urlsInFrontier).to.equal(2);
      expect(frontier.currentlyReading).to.be.false;
    });

    it("does not change the number of urls in the frontier if the read fails", async () => {
      storage.readFileAsync = sinon.stub().returns(Promise.reject());
      const eventCoordinator = new Events();
      const logger = makeLogger(eventCoordinator);
      const frontier = new Frontier("www.bing.com", logger, storage);

      expect(frontier.urlsInFrontier).to.equal(1);
      await frontier.getNextUrl();
      expect(frontier.urlsInFrontier).to.equal(1);
    });
  });
});
