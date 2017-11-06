
// Since we need to hit the s3 api asynchronously (I know, total BS that we can't hit it synchronously) in prod,
// let's also wrap the dev environment in a promise to provide a common api.

credentialsPromise = Promise.resolve(require("../logentries-credentials").DEV_TOKEN)

module.exports = {
  LOGENTRIES_TOKEN_PROMISE: credentialsPromise
};
