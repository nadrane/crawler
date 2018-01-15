const codeModule = "parser";

module.exports = logger => {
  return {
    parsingError: () => {
      logger.debug({
        event: "parsing error",
        codeModule
      });
    }
  };
};
