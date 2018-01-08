const { PassThrough } = require("stream");

class TestStream extends PassThrough {
  constructor(options) {
    super(options);
    this.buffer = [];
  }

  _transform(data, enc, done) {
    this.buffer.push(data);
    done();
  }

  toString() {
    return this.buffer.join("\n");
  }
}

module.exports = TestStream;
