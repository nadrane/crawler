let env;
if (process.env.NODE_ENV === "production") {
  env = require("./production");
} else if (process.env.NODE_ENV === "development") {
  env = require("./development");
} else if (process.env.NODE_ENV === "test") {
  env = require("./test");
} else {
  throw new Error("environment not defined");
}

env.isProd = function isProd() {
  return process.env.NODE_ENV === "production";
};

env.isDev = function isDev() {
  return process.env.NODE_ENV === "development";
};

module.exports = Object.assign({}, require("./defaults"), env);
