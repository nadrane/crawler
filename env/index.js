const path = require("path");

let env;
if (process.env.NODE_ENV === "production") {
  env = require('./production');
} else if (process.env.NODE_ENV === "development"){
  env = require('./development');
} else {
  throw new Error('environment not defined')
}

Object.assign(env, require('./defaults'));

env.isProd = function() {
  return process.env.NODE_ENV === "production";
};

env.isDev = function() {
  return process.env.NODE_ENV === "development";
};

module.exports = env