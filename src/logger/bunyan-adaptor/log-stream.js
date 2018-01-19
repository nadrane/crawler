const { Writable } = require("stream");
const { LOG_STREAM_BUFFER_SIZE } = require("../../../env/");

class LogStream extends Writable {
  constructor(url, http, bufferSize = LOG_STREAM_BUFFER_SIZE) {
    super({ objectMode: true });
    this.buffer = [];
    this.url = url;
    this.http = http;
    this.bufferSize = bufferSize;
  }

  _write(log, encoding, callback) {
    this.buffer.push(log);
    if (this.buffer.length >= this.bufferSize) {
      this._makeRequest(callback);
    } else {
      callback();
    }
  }

  _makeRequest(callback) {
    this.http
      .post(this.url, this.buffer.join("\n"))
      .then(() => {
        this.buffer = [];
        callback();
      })
      .catch(err => {
        err.config.data = "";
        console.log("error posting", err);
        callback();
      });
  }

  _final(callback) {
    this.http
      .post(this.url, this.buffer.join("\n"))
      .then(() => {
        callback();
      })
      .catch(err => {
        callback();
      });
  }
}

module.exports = LogStream;
