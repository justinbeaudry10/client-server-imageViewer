const HEADER_SIZE = 12;
const VERSION = 7;

module.exports = {
  resPktHeader: "",
  payload: "",
  payloadSize: 0,

  init: function (resType, seqNum, timestamp, img, imgSize) {
    // Setting the payload size
    this.payload = new Buffer.alloc(imgSize);
    this.payloadSize = imgSize;

    // Populating header
    this.resPktHeader = new Buffer.alloc(HEADER_SIZE);
    storeBitPacket(this.resPktHeader, VERSION, 0, 4);
    storeBitPacket(this.resPktHeader, resType, 4, 8);
    storeBitPacket(this.resPktHeader, seqNum, 12, 20);
    storeBitPacket(this.resPktHeader, timestamp, 32, 32);
    storeBitPacket(this.resPktHeader, imgSize, 64, 32);

    // If found, set the payload data to the img
    if (resType === 1) {
      for (let i = 0; i < imgSize; i++) {
        this.payload[i] = img[i];
      }
    }
  },

  //--------------------------
  //getpacket: returns the entire packet
  //--------------------------
  getPacket: function () {
    // Packet size is Header size + payload size
    let packet = new Buffer.alloc(HEADER_SIZE + this.payloadSize);

    // Populate the header
    for (let i = 0; i < HEADER_SIZE; i++) {
      packet[i] = this.resPktHeader[i];
    } // Populate the payload
    for (let j = 0; j < this.payloadSize; j++) {
      packet[HEADER_SIZE + j] = this.payload[j];
    }

    return packet;
  },
};

//// Some usefull methods ////
// Feel free to use them, but DON NOT change or add any code in these methods.

// Store integer value into specific bit poistion the packet
function storeBitPacket(packet, value, offset, length) {
  // let us get the actual byte position of the offset
  let lastBitPosition = offset + length - 1;
  let number = value.toString(2);
  let j = number.length - 1;
  for (var i = 0; i < number.length; i++) {
    let bytePosition = Math.floor(lastBitPosition / 8);
    let bitPosition = 7 - (lastBitPosition % 8);
    if (number.charAt(j--) == "0") {
      packet[bytePosition] &= ~(1 << bitPosition);
    } else {
      packet[bytePosition] |= 1 << bitPosition;
    }
    lastBitPosition--;
  }
}
