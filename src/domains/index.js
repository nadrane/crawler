const domainFactory = require('./domains');
const { SEED_FILE_PROMISE } = require('APP/env')

module.exports = domainFactory(SEED_FILE_PROMISE)