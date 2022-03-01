// Declares a variable for the timestamp value
let timestamp;

function initTimer() {
  // Initial value from 1 to 999
  timestamp = Math.floor(Math.random() * 999 + 1);

  // Ticks every 10 ms
  setInterval(incTimestamp, 10);
}

// Increments timestamp by 1 for each tick, resets at 2^32
function incTimestamp() {
  timestamp++;
  if (timestamp >= Math.pow(2, 32)) {
    timestamp = 1;
  }
  //console.log(timestamp);
}

module.exports = {
  init: function () {
    initTimer();
  },

  //--------------------------
  //getSequenceNumber: return the current sequence number + 1
  //--------------------------
  getSequenceNumber: function () {
    // Enter your code here //
    return "this should be a correct sequence number";
  },

  //--------------------------
  //getTimestamp: return the current timer value
  //--------------------------
  getTimestamp: function () {
    return timestamp;
  },
};
