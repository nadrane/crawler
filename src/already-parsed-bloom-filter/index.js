const { BloomFilter } = require("bloomfilter");

class AlreadyParsed {
  constructor(eventCoordinator) {
    this.eventCoordinator = eventCoordinator;
    this.parsedUrls = new BloomFilter(9.6 * 25000000, 7);

    //We mark a url as visited when the request is sent instead of recieved.
    //This way we won't accidentally parse the same url twice
    eventCoordinator.addListener("request sent", this.addlink.bind(this));
  }

  addLink(url) {
    this.parsedUrls.add(url);
  }

  checkIfParsed(url) {
    eventCoordinator.emit("parse check completed", this.parsedUrls.test(url));
  }
}

module.exports = AlreadyParsed;
