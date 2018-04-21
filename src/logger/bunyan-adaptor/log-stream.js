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

  async _write(log, encoding, callback) {
    console.log("adding ", log);
    this.buffer.push(log);
    if (this.buffer.length >= this.bufferSize) {
      await this._makeRequest();
    }
    callback();
  }

  async _final(callback) {
    await this._makeRequest();
    callback();
  }

  async _makeRequest() {
    clearInterval(this.flushEventually);

    try {
      this.buffer = [];
      await this.http.post(this.url, this.buffer.join(""));
      this.buffer = [];
    } catch (err) {
      // remember that the buffer can be modified while the HTTP request is being made
      console.log("error posting", err);
    }
    const oneMinute = 1000 * 60;
    this.flushEventually = setInterval(this._makeRequest.bind(this), oneMinute);
  }
}

module.exports = LogStream;
