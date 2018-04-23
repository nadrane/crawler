const FrontierList = require("./frontier-list");
const throughConcurrent = require("../through-concurrent");

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
    logger.frontiers.streamEntered();
    try {
      const url = await frontierList.getNextUrlForDomain(domain);
      if (url) {
        console.log("pushing url ", url);
        this.push(url);
      }
    } catch (err) {
      logger.unexpectedError(err, "frontier stream failure");
    }
    logger.frontiers.streamExited();
    done();
  });
};
