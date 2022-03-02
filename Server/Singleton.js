// Declares a variable for the timestamp value
let timestamp, seqNum;
const MS_PER_TICK = 10;

// Returns randon number from 1 to 999
const getRandNum = () => {
  return Math.floor(Math.random() * 999 + 1);
};

module.exports = {
  init: function () {
    timestamp = getRandNum();
    seqNum = getRandNum();

    // Tick callback fn called every MS_PER_TICK milliseconds
    setInterval(() => {
      timestamp++;
      if (timestamp >= Math.pow(2, 32)) {
        timestamp = 1;
      }
    }, MS_PER_TICK);
  },

  //--------------------------
  //getSequenceNumber: return the current sequence number + 1
  //--------------------------
  getSequenceNumber: function () {
    return ++seqNum % Math.pow(2, 20);
  },

  //--------------------------
  //getTimestamp: return the current timer value
  //--------------------------
  getTimestamp: function () {
    return timestamp;
  },
};
