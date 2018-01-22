const { Writable } = require("stream");
const { LOG_STREAM_BUFFER_SIZE } = require("../../../env/");

class LogStream extends Writable {
  constructor(url, http, bufferSize = LOG_STREAM_BUFFER_SIZE) {
    super({ objectMode: true });
    this.buffer = [];
    this.url = url;
    this.http = http;
    this.bufferSize = bufferSize;

    const oneMinute = 1000 * 60;
    this.flushEventually = setInterval(this._makeRequest.bind(this), oneMinute);
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
    clearInterval(this.flushEventually);
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
      })
      .then(() => {
        const oneMinute = 1000 * 60;
        this.flushEventually = setInterval(this._makeRequest.bind(this), oneMinute);
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
