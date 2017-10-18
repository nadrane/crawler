const path = require("path");

let env;
if (process.env.NODE_ENV === "production") {
  env = require('./production');
} else {
  env = require('./development');
}

Object.assign(env, require('./defaults'));

env.isProd = function() {
  return env.NODE_ENV === "production";
};

env.isDev = function() {
  return env.NODE_ENV === "development";
};

module.exports = env