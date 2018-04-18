const codeModule = "bloom filter";

module.exports = logger => ({
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

  visitedLink: url => {
    logger.debug({
      event: "link already visited",
      codeModule,
      url
    });
  },

  newLink: url => {
    logger.debug({
      event: "new link",
      codeModule,
      url
    });
  },

  markingAsSeen: url => {
    logger.debug({
      event: "mark as seen",
      codeModule,
      url
    });
  }
});
