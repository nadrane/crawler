const axios = require("axios");
const fs = require("fs");
const Events = require("events");
const through2 = require("through2");

const configureProcessErrorHandling = require("./error-handling");
const makeDomainStream = require("../domains/");
const makeDomainToUrlStream = require("../frontiers");
const makeRobotsStream = require("../robots-parser/");
const makeRequestStream = require("../requester/");
const makeBloomFilterClient = require("../bloom-filter");
const makeLogger = require("../logger/");
const { SERVER_INFO, MAX_CONCURRENCY } = require("../../env/");

class CrawlerProcess extends Events {
  constructor(seedData, dependencies, options) {
    super();
    process.title = "crawler - child";

    this.eventCoordinator = new Events();
    this.logger = dependencies.logger;
    this.logger.eventCoordinator = this.eventCoordinator;
    this.http = responseTimeTrackingHttp.bind(null, dependencies.logger);
    this.storage = dependencies.storage;
    this.bloomFilterCheckStream = dependencies.checkStream;
    this.bloomFilterSetStream = dependencies.setStream;
    this.maxConcurrency = options.maxConcurrency || MAX_CONCURRENCY;
    this.running = false;

    configureProcessErrorHandling(this.logger);
    process.on("disconnect", () => {
      console.log(process.pid, "disconnected");
    });

    this.eventCoordinator.on("error", err => {
      this.emit("error", err);
    });
    this.eventCoordinator.on("flushedLinkQueue", ({ count }) => {
      console.log("it flushed at crawler level", count);
      this.emit("flushedLinkQueue", { count });
    });

    this.linkStream = this.composeStreams(seedData, options);
  }

  composeStreams(seedData, options) {
    const maxConcurrency = options.maxConcurrency || 10;
    const streams = [];

    streams.push(makeDomainStream(seedData, this.eventCoordinator, this.logger, maxConcurrency));

    streams.push(makeDomainToUrlStream(
      seedData,
      this.logger,
      this.eventCoordinator,
      this.storage,
      maxConcurrency
    ));

    if (!options.exclude.robots) {
      streams.push(makeRobotsStream(this.logger, this.http("robots"), maxConcurrency));
    }

    streams.push(makeRequestStream(this.logger, this.http("requester"), this.eventCoordinator, maxConcurrency));

    if (!options.exclude.bloomFilter && this.bloomFilterCheckStream && this.bloomFilterSetStream) {
      streams.push(this.bloomFilterCheckStream);
      streams.push(this.bloomFilterSetStream);
    }

    const { eventCoordinator } = this;
    streams.push(through2.obj(function(url, enc, cb) {
      eventCoordinator.emit("new link", {
        newUrl: url,
        fromUrl: ""
      });
      this.push(url);
      cb();
    }));

    streams.push(fs.createWriteStream("/dev/null"));

    return streams.reduce((allStreams, nextStream) => allStreams.pipe(nextStream));
  }

  start() {
    this.eventCoordinator.emit("start");
    this.running = true;
  }

  stop() {
    this.eventCoordinator.emit("stop");
    this.running = false;
  }

  addUrl(newUrl) {
    this.eventCoordinator.emit("new link", {
      newUrl,
      fromUrl: ""
    });
  }
}

// Only run if forked from main process
if (require.main === module) {
  SERVER_INFO.then(async ({ statServerHost, statServerPort, bloomFilterUrl }) => {
    const seedData = process.argv.slice(2)[0].split(",");
    const logger = makeLogger(axios, { statServerHost, statServerPort });
    const bloomFilterClient = makeBloomFilterClient(logger, bloomFilterUrl);
    const Crawler = new CrawlerProcess(seedData, { logger, storage: fs, bloomFilterClient });
    Crawler.start();
  });
}

module.exports = async function makeCrawlerProcess(seedData, dependencies = {}, options = {}) {
  if (!options.exclude) {
    options.exclude = {};
  }

  if (!options.exclude.bloomFilter && !(dependencies.setStream && dependencies.checkStream)) {
    const client = await makeBloomFilterClient(dependencies.logger, {
      host: options.bloomFilterUrl,
      name: options.name,
      concurrency: options.concurrency
    });

    await client.initialize();
    dependencies.setStream = client.setStream;
    dependencies.checkStream = client.checkStream;
  }

  return new CrawlerProcess(seedData, dependencies, options);
};

function responseTimeTrackingHttp(logger, codeModule) {
  const trackingHttp = axios.create();
  trackingHttp.interceptors.request.use(config => Object.assign({ startTime: Date.now() }, config));

  trackingHttp.interceptors.response.use(response => {
    const { startTime } = response.config;
    const responseDuration = Date.now() - startTime;
    logger[codeModule].trackResponseTime(response.url, responseDuration);
    return response;
  });
  return trackingHttp;
}
