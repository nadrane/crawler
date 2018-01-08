const path = require("path");
const mkdirp = require("mkdirp");
const env = require("../../env/");

module.exports = function configureHeapDumps() {
  if (env.isDev()) {
    const heapdump = require("heapdump");
    const debugDir = path.join(env.LOGGING_DIR, "heap-dumps");
    mkdirp(debugDir);
    setInterval(() => {
      heapdump.writeSnapshot(path.join(debugDir, `${Date.now()}.heapsnapshot`));
    }, 10 * 1000);
  }
};
