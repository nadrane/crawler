const path = require("path");
const sinon = require("sinon");
const { expect } = require("chai");
const Frontier = require("APP/src/frontiers/frontier");
const { FRONTIER_DIRECTORY } = require("APP/env/");
const makeLogger = require("APP/src/logger/");
const Events = require("Events");
const { APPEND_FLUSH_TIME } = require("APP/env");

describe.only("Frontier", () => {
  let logger;
  let frontier;
  let storage;

  beforeEach(async () => {
    logger = await makeLogger();
    storage = {
      writeFileAsync: sinon.stub().returns(Promise.resolve()),
      writeFileSync: sinon.spy(),
      readFileSync: sinon.stub().returns(Buffer.from("")),
      appendFileAsync: sinon.spy(),
      existsSync: () => false
    };
    frontier = new Frontier("google.com", logger, new Events(), storage);
  });

  describe("constructor", () => {
    it("sets the filepaths equal to the frontier directory plus the name of the domain", () => {
      frontier = new Frontier("google.com", logger, new Events(), storage);
      const expectedFrontierPath = path.join(FRONTIER_DIRECTORY, "google.com", "frontier.txt");
      const expectedFrontierIndexPath = path.join(
        FRONTIER_DIRECTORY,
        "google.com",
        "frontier-index.txt"
      );

      expect(frontier.filePaths.frontier).to.equal(expectedFrontierPath);
      expect(frontier.filePaths.frontierIndex).to.equal(expectedFrontierIndexPath);
    });

    it("when setting file names, it disregards the protocol, if included", () => {
      frontier = new Frontier("http://google.com", logger, new Events(), storage);
      const expectedFrontierPath = path.join(FRONTIER_DIRECTORY, "google.com", "frontier.txt");
      const expectedFrontierIndexPath = path.join(
        FRONTIER_DIRECTORY,
        "google.com",
        "frontier-index.txt"
      );

      expect(frontier.filePaths.frontier).to.equal(expectedFrontierPath);
      expect(frontier.filePaths.frontierIndex).to.equal(expectedFrontierIndexPath);
    });

    describe("during file initilization", () => {
      describe("when the frontier file does not exist", () => {
        beforeEach(() => {
          storage.existsSync = () => false;
        });
        afterEach(() => {
          storage.existsSync = undefined;
        });
        describe("when a protocol is included", () => {
          it("writes the seed domain to the frontier if the domain includes a protocol", () => {
            frontier = new Frontier("http://google.com", logger, new Events(), storage);
            expect(storage.writeFileSync.calledWithExactly(
              frontier.filePaths.frontier,
              "http://google.com\n"
            )).to.be.true;
          });

          it("writes 0 to the frontier-index file", () => {
            frontier = new Frontier("http://google.com", logger, new Events(), storage);
            expect(storage.writeFileSync.calledWithExactly(frontier.filePaths.frontierIndex, 0)).to
              .be.true;
          });
        });
        describe("when a protocol is not incldued", () => {
          it("writes the seed domain to the frontier file", () => {
            frontier = new Frontier("google.com", logger, new Events(), storage);
            expect(storage.writeFileSync.calledWithExactly(
              frontier.filePaths.frontier,
              "http://google.com\n"
            )).to.be.true;
          });

          it("writes an 0 to the frontier-index file", () => {
            frontier = new Frontier("google.com", logger, new Events(), storage);
            expect(storage.writeFileSync.calledWithExactly(frontier.filePaths.frontierIndex, 0)).to
              .be.true;
          });
        });
      });

      describe("when the frontier file does exist", () => {
        beforeEach(() => {
          storage.existsSync = () => true;
        });
        afterEach(() => {
          storage.existsSync = undefined;
        });
        it("initializes the frontier and frontierIndex with the contents of the frontier and frontier-index files", () => {
          storage.readFileSync = sinon.stub();
          storage.readFileSync
            .onFirstCall()
            .returns(Buffer.from("google.com\ngoogle.com/search\ngoogle.com/link1\n"));
          storage.readFileSync.onSecondCall().returns(Buffer.from("0"));

          frontier = new Frontier("google.com", logger, new Events(), storage);
          expect(frontier.uncrawledUrlsInFrontier).to.equal(3);
          expect(frontier.frontierIndex).to.equal(0);
        });

        it("does not count scraped urls when calculating frontier.urlsInFrontier", () => {
          storage.readFileSync = sinon.stub();
          storage.readFileSync
            .onFirstCall()
            .returns(Buffer.from("google.com\ngoogle.com/search\ngoogle.com/link1\n"));
          storage.readFileSync.onSecondCall().returns(Buffer.from("2"));

          frontier = new Frontier("google.com", logger, new Events(), storage);
          expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
          expect(frontier.frontierIndex).to.equal(2);
        });
      });
    });
  });

  describe("isEmpty", () => {
    it("should return false when the frontier is not empty", () => {
      expect(frontier.isEmpty()).to.be.false;
    });

    it("should return true when the frontier is empty", () => {
      frontier.uncrawledUrlsInFrontier = 0;
      expect(frontier.isEmpty()).to.be.true;
    });
  });

  describe("readyForReading", () => {
    it("should be ready for reading upon creation", () => {
      expect(frontier.readyForReading()).to.be.true;
    });

    it("should not be ready for reading when the frontier is empty", () => {
      frontier.uncrawledUrlsInFrontier = 0;
      expect(frontier.readyForReading()).to.be.false;
    });

    it("should not be ready for reading when the currently reading flag is set, regardless of the size of the frontier", () => {
      frontier.currentlyReading = true;
      expect(frontier.readyForReading()).to.be.false;

      frontier.uncrawledUrlsInFrontier = 10;
      expect(frontier.readyForReading()).to.be.false;
    });
  });

  describe("append", () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });

    it("queues up a link to add to the frontier", () => {
      frontier.append("www.yahoo.com");
      expect(frontier.queuedNewlinks.size).to.equal(1);
    });

    it("calls flushNewLinkQueue after APPEND_FLUSH_TIME", () => {
      const newLinkQueueSpy = sinon.spy(frontier, "flushNewLinkQueue");
      frontier.append("www.yahoo.com");

      clock.tick(APPEND_FLUSH_TIME - 1);
      expect(newLinkQueueSpy.notCalled).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;
    });

    it("does not schedule flushNewLinkQueue multiple times given multiple calls within APPEND_FLUSH_TIME duration", () => {
      const newLinkQueueSpy = sinon.spy(frontier, "flushNewLinkQueue");
      frontier.append("www.yahoo.com");
      frontier.append("www.microsoft.com");

      clock.tick(APPEND_FLUSH_TIME - 1);
      expect(newLinkQueueSpy.notCalled).to.be.true;
      clock.tick(1);
      expect(newLinkQueueSpy.calledOnce).to.be.true;
    });
  });

  describe("flushNewLinkQueue", () => {
    let flushLinkQueue;
    let clock;

    beforeEach(() => {
      flushLinkQueue = sinon.spy(frontier, "flushNewLinkQueue");
      clock = sinon.useFakeTimers();
      frontier.flushScheduled = true;
      frontier.queuedNewlinks = new Set(["www.microsoft.com", "www.yahoo.com"]);
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
      expect(storage.appendFileAsync.calledWithExactly(
        frontier.filePaths.frontier,
        "www.microsoft.com\nwww.yahoo.com\n"
      )).to.be.true;
      expect(frontier.uncrawledUrlsInFrontier).to.equal(3);
      expect(frontier.flushScheduled).to.be.false;
      expect(frontier.currentlyReading).to.be.false;
      expect(frontier.queuedNewlinks).to.be.empty;
    });

    it("does not change the state of the frontier if the append fails", async () => {
      sinon.stub(logger.frontiers, "appendUrlFailed");
      storage.appendFileAsync = sinon.stub().returns(Promise.reject());
      frontier.currentlyReading = false;
      frontier.flushScheduled = true;

      await frontier.flushNewLinkQueue();

      expect(logger.frontiers.appendUrlFailed.calledOnce).to.be.true;
      expect(storage.appendFileAsync.calledOnce).to.be.true;
      expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
      expect(frontier.flushScheduled).to.be.false;
      expect(frontier.currentlyReading).to.be.false;
      expect(frontier.queuedNewlinks).to.deep.equal(new Set(["www.microsoft.com", "www.yahoo.com"]));
    });

    it("preserves urls added during the async append operation if the append fails", async () => {
      storage.appendFileAsync = sinon
        .stub()
        .callsFake(() => new Promise((resolve, reject) => setTimeout(reject(), 50)));

      frontier.append("www.nick.com");
      await frontier.flushNewLinkQueue();
      clock.tick(APPEND_FLUSH_TIME);
      frontier.append("www.chris.com");
      clock.tick(50);

      expect(storage.appendFileAsync.calledOnce).to.be.true;
      expect([...frontier.queuedNewlinks.values()]).to.deep.equal([
        "www.microsoft.com",
        "www.yahoo.com",
        "www.nick.com",
        "www.chris.com"
      ]);
    });
  });

  describe("getNextUrl", () => {
    it("returns the frontier urls in order, never repeating itself", async () => {
      const frontierUrls = "www.bing.com\nwww.bing.com/link1\nwww.bing.com/link2";
      storage.readFileAsync = sinon.stub().returns(frontierUrls);
      frontier.uncrawledUrlsInFrontier = 3;

      expect(await frontier.getNextUrl()).to.equal("www.bing.com");
      expect(frontier.uncrawledUrlsInFrontier).to.equal(2);
      expect(await frontier.getNextUrl()).to.equal("www.bing.com/link1");
      expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
      expect(await frontier.getNextUrl()).to.equal("www.bing.com/link2");
      expect(frontier.uncrawledUrlsInFrontier).to.equal(0);
    });

    it("returns an empty string if the frontier is empty", async () => {
      frontier.uncrawledUrlsInFrontier = 0;
      expect(await frontier.getNextUrl()).to.equal("");
    });

    it("currentlyReading is false after successfully returning", async () => {
      storage.readFileAsync = sinon.stub().returns("www.bing.com");

      await frontier.getNextUrl();
      expect(frontier.currentlyReading).to.be.false;
    });

    it("currentlyReading is false after reading throws an error", async () => {
      storage.readFileAsync = sinon.stub().returns(Promise.reject());
      logger.frontiers.readUrlFailed = sinon.spy();

      await frontier.getNextUrl();

      expect(logger.frontiers.readUrlFailed.calledOnce).to.be.true;
      expect(frontier.currentlyReading).to.be.false;
    });

    it("does not change the number of urls in the frontier if the read fails", async () => {
      storage.readFileAsync = sinon.stub().returns(Promise.reject());
      logger.frontiers.readUrlFailed = sinon.spy();

      expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
      await frontier.getNextUrl();
      expect(frontier.uncrawledUrlsInFrontier).to.equal(1);
    });
  });
});
