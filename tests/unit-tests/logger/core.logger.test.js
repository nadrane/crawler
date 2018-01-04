const sinon = require("sinon");
const { expect } = require("chai");
const Logger = require("APP/src/logger/core-logger");
const Events = require("events");

describe("Core Logger", () => {
  it("should emit the stop event when 5 unexpected errors occur within a 1 second window", done => {
    const eventCoordinator = new Events();
    const logger = new Logger(eventCoordinator, "/dev/null", () => ({ error: () => null }));
    const clock = sinon.useFakeTimers();
    eventCoordinator.on("stop", () => {
      done();
    });

    clock.tick(1000);
    for (let _ of [1, 2, 3, 4, 5]) {
      logger.trackUnexpectedErrors();
    }

    clock.restore();
  });

  it("should not emit the stop event when only 4 unexpected errors occur within a 1001 millisecond window", () => {
    const eventCoordinator = new Events();
    const logger = new Logger(eventCoordinator, "/dev/null", () => ({ error: () => null }));
    const clock = sinon.useFakeTimers();
    const p = new Promise((resolve, reject) => {
      eventCoordinator.on("stop", () => {
        reject(new Error("stop event was incorrectly emitted"));
      });
      setTimeout(() => {
        resolve();
      }, 1100);
    });

    logger.trackUnexpectedErrors();
    clock.tick(1001);
    for (let _ of [1, 2, 3, 4]) {
      logger.trackUnexpectedErrors();
    }

    clock.tick(99); // make sure promise resolves
    clock.restore();
    return p;
  });

  it("should not emit the stop event when only 4 unexpected errors occur within a 1 second window", () => {
    const eventCoordinator = new Events();
    const logger = new Logger(eventCoordinator, "/dev/null", () => ({ error: () => null }));
    const clock = sinon.useFakeTimers();
    const p = new Promise((resolve, reject) => {
      eventCoordinator.on("stop", () => {
        reject(new Error("stop event was incorrectly emitted"));
      });
      setTimeout(() => {
        resolve();
      }, 1);
    });

    for (let _ of [1, 2, 3, 4,]) {
      logger.trackUnexpectedErrors();
    }

    clock.tick(1); // make sure promise resolves
    clock.restore();
    return p;
  });
});
