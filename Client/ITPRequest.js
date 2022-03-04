// You may need to add some delectation here
const HEADER_SIZE = 12;
const REQ_TYPE = 0;

module.exports = {
  reqPktHeader: "",
  payload: "",
  payloadSize: 0,

  init: function (version, timestamp, imgExt, imgName) {
    // Gets the image name in bytes, sets the payload size to its size
    let imgNameBytes = stringToBytes(imgName);
    this.payloadSize = imgNameBytes.length;

    let imgType;

    switch (imgExt) {
      case "bmp":
        imgType = 1;
        break;
      case "jpeg":
        imgType = 2;
        break;
      case "gif":
        imgType = 3;
        break;
      case "png":
        imgType = 4;
        break;
      case "tiff":
        imgType = 5;
        break;
      case "raw":
        imgType = 15;
        break;
    }

    // Populating header
    this.reqPktHeader = new Buffer.alloc(HEADER_SIZE);
    storeBitPacket(this.reqPktHeader, version, 0, 4);
    storeBitPacket(this.reqPktHeader, REQ_TYPE, 24, 8);
    storeBitPacket(this.reqPktHeader, timestamp, 32, 32);
    storeBitPacket(this.reqPktHeader, imgType, 64, 4);
    storeBitPacket(this.reqPktHeader, this.payloadSize, 68, 28);

    // Populating payload
    this.payload = new Buffer.alloc(this.payloadSize);
    for (let i = 0; i < imgNameBytes.length; i++) {
      this.payload[i] = imgNameBytes[i];
    }
  },

  //--------------------------
  //getBytePacket: returns the entire packet in bytes
  //--------------------------
  getBytePacket: function () {
    // Packet size should be header size + payload size
    let packet = new Buffer.alloc(HEADER_SIZE + this.payloadSize);

    // Populating the header
    for (let i = 0; i < HEADER_SIZE; i++) {
      packet[i] = this.reqPktHeader[i];
    } // Populating the payload
    for (let j = 0; j < this.payloadSize; j++) {
      packet[HEADER_SIZE + j] = this.payload[j];
    }

    return packet;
  },
};

//// Some usefull methods ////
// Feel free to use them, but DON NOT change or add any code in these methods.

// Convert a given string to byte array
function stringToBytes(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}

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
