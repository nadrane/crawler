const FrontierList = require("./frontier-list");
const throughConcurrent = require("../through-concurrent");

let count = 0;
module.exports = function makeDomainToUrlStream(
  seedDomains,
  logger,
  eventCoordinator,
  storage,
  concurrency
) {
  const frontierList = new FrontierList(seedDomains, logger, eventCoordinator, storage);
  return throughConcurrent(logger, "frontier stream", concurrency, async function(
    domain,
    enc,
    done
  ) {
    // logger.frontier.streamEntered();
    try {
      const url = await frontierList.getNextUrlForDomain(domain);
      if (url) {
        count++;
        console.log("retrieved url ", count, url);
        this.push(url);
      }
    } catch (err) {
      logger.unexpectedError(err, "frontier stream failure");
    }
    // logger.frontier.streamExited();
    done();
  });
};
