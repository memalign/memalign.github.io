
// Usage:
// let runloop = new MARunloop()
// runloop.runFunctionAfterDelay(function() {
//   // Some code
// }, delay)

class MARunloopEvent {
  // Properties:
  // - fnToRun (function)
  // - secondsToWait (float, seconds to wait (can be fractional) before executing fnToRun)
  constructor(fnToRun, secondsToWait) {
    this.fnToRun = fnToRun
    this.secondsToWait = secondsToWait
  }
}

class MARunloop {
  // Properties:
  // - scheduledEvents (array of MARunloopEvent instances)
  constructor() {
    this.scheduledEvents = []
    this.runloopTimerScheduledTimeMillis = null
  }

  runFunctionAfterDelay(fnToRun, delayInSeconds) {
    // The events already in the queue have a delayInSeconds value for time that has already elapsed since the runloop timer was scheduled
    // When the timer fires, we will subtract the number of seconds that elapsed since it was scheduled
    // To wait the full intended delayInSeconds, we need to artificially add the time that already elapsed before this event is being enqueued.
    if (this.runloopTimerScheduledTimeMillis) {
      let now = Date.now()
      let delta = now - this.runloopTimerScheduledTimeMillis
      if (delta > 0) {
        // To have the same time basis as the other events in the queue
        // backdate our delayInSeconds based on the timer that's already scheduled
        delayInSeconds += delta/1000
      }
    }
    let rEvent = new MARunloopEvent(fnToRun, delayInSeconds)
    this.scheduledEvents.push(rEvent)
    this.scheduleRunloopTimerIfNecessary()
  }

  runloopTimerFired() {
    let eventsToRun = []
    if (this.runloopTimerScheduledTimeMillis) {

      let now = Date.now()
      let delta = now - this.runloopTimerScheduledTimeMillis
      if (delta > 0) {
        for (let rEvent of this.scheduledEvents) {
          rEvent.secondsToWait -= delta/1000
        }

        // Sort from smallest to largest seconds to wait (so most negative will be first)
        eventsToRun = this.scheduledEvents.filter(x => x.secondsToWait <= 0).sort((a, b) => a.secondsToWait - b.secondsToWait)

        this.scheduledEvents = this.scheduledEvents.filter(x => x.secondsToWait > 0)
      }

      this.runloopTimerScheduledTimeMillis = null
    }

    this.scheduleRunloopTimerIfNecessary()

    for (let rEvent of eventsToRun) {
      rEvent.fnToRun()
    }
  }

  scheduleRunloopTimerIfNecessary() {
    if (this.scheduledEvents.length <= 0) {
      return
    }
    // Pick the smallest secondsToWait and then schedule a timer
    // Before scheduling a new timer, I could be more clever about checking whether the timer that's already scheduled will fire soon enough for the ripest event but I figure that extra efficiency isn't worth the risk of a subtle bug
    let smallestSecondsToWait = this.scheduledEvents[0].secondsToWait
    for (let rEvent of this.scheduledEvents) {
      if (rEvent.secondsToWait < smallestSecondsToWait) {
        smallestSecondsToWait = rEvent.secondsToWait
      }
    }

    if (this.runloopTimerScheduledTimeMillis) {
      let now = Date.now()
      let deltaMillis = now - this.runloopTimerScheduledTimeMillis
      if (deltaMillis > 0) {
        smallestSecondsToWait = Math.max(0.001, smallestSecondsToWait-deltaMillis)
      }
    }

    // The secondsToWait are based on when the timer was originally scheduled
    // Keep the same time basis if a timer was already scheduled
    if (!this.runloopTimerScheduledTimeMillis) {
      this.runloopTimerScheduledTimeMillis = Date.now()
    }

    let rl = this
    setTimeout(function() {
      rl.runloopTimerFired()
    }, smallestSecondsToWait*1000)
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MARunloop };
}
