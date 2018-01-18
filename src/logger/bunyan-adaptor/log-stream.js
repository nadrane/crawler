const { Writable } = require("stream");

class LogStream extends Writable {
  constructor(url, http, bufferSize = 5000) {
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
        //just ignore the error and don't reset the buffer
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
