const codeModule = "bloom filter";

module.exports = logger => {
  return {
    setStreamEntered: () => {
      logger.debug({
        event: "set entered",
        codeModule
      });
    },

    setStreamExited: () => {
      logger.debug({
        event: "set left",
        codeModule
      });
    },

    checkStreamEntered: () => {
      logger.debug({
        event: "check entered",
        codeModule
      });
    },

    visitedLink: () => {
      logger.debug({
        event: "link already visited",
        codeModule
      });
    },

    newLink: () => {
      logger.debug({
        event: "new link",
        codeModule
      });
    }
  };
};
