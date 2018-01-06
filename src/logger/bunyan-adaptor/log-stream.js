const { Writable } = require("stream");

class LogStream extends Writable {
  constructor(url, http, bufferSize = 100) {
    super({ objectMode: true });
    this.buffer = [];
    this.url = url;
    this.http = http;
    this.bufferSize = bufferSize;
  }

  _write(log, encoding, callback) {
    this.buffer.push(log);
    if (this.buffer.length >= this.bufferSize) {
      this.http.post(this.url, this.buffer.join("\n")).then(() => {
        this.buffer = [];
        callback();
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    this.http.post(this.url, this.buffer.join("\n")).then(() => {
      callback();
    });
  }
}

module.exports = LogStream;
