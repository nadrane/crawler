const productionEnv = require("./production");
const devEnv = require("./development");

let env;
if (process.env.NODE_ENV === "production") {
  env = productionEnv;
} else if (process.env.NODE_ENV === "development") {
  env = devEnv;
} else {
  throw new Error("environment not defined");
}

Object.assign(env, require("./defaults"));

env.isProd = function isProd() {
  return process.env.NODE_ENV === "production";
};

env.isDev = function isDev() {
  return process.env.NODE_ENV === "development";
};

module.exports = env;
