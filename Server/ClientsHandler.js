const ITPpacket = require("./ITPResponse");
const singleton = require("./Singleton");
const fs = require("fs");

module.exports = {
  handleClientJoining: function (sock) {
    // Get current server timestamp
    let curTime = singleton.getTimestamp();

    console.log(`\nClient-${curTime} is connected at timestamp: ${curTime}`);

    sock.on("error", (err) => {
      console.log(`\nClient-${curTime} forcibly closed`);
    });

    // When the socket recieves data
    sock.on("data", (reqPkt) => {
      let version = parseBitPacket(reqPkt, 0, 4); // Should be 7

      if (version !== 7) return;

      console.log("ITP packet received:");
      printPacketBit(reqPkt);

      // Getting values from the request packet
      let reqTypeInt = parseBitPacket(reqPkt, 24, 8); // Always 0
      let timestamp = parseBitPacket(reqPkt, 32, 32);
      let fileExtInt = parseBitPacket(reqPkt, 64, 4);
      let fileName = bytesToString(reqPkt.slice(12));

      let reqType, fileExt;

      switch (reqTypeInt) {
        case 0:
          reqType = "Query";
          break;
        case 1:
          reqType = "Found";
          break;
        case 2:
          reqType = "Not found";
          break;
        case 3:
          reqType = "Busy";
          break;
      }

      switch (fileExtInt) {
        case 1:
          fileExt = "BMP";
          break;
        case 2:
          fileExt = "JPEG";
          break;
        case 3:
          fileExt = "GIF";
          break;
        case 4:
          fileExt = "PNG";
          break;
        case 5:
          fileExt = "TIFF";
          break;
        case 15:
          fileExt = "RAW";
          break;
      }

      console.log(`\nClient-${curTime} requests:
          --ITP version: ${version}
          --Timestamp: ${timestamp}
          --Request type: ${reqType}
          --Image file extension(s): ${fileExt}
          --Image file name: ${fileName}`);

      // Get the image
      getImage(fileName, fileExt, sock);
    });

    // When the socket closes, print message
    sock.on("close", () => {
      console.log(`\nClient-${curTime} closed the connection`);
    });
  },
};

// Function to get the image
const getImage = (fileName, ext, sock) => {
  // Reads the file from the images folder
  fs.readFile(`images/${fileName}.${ext.toLowerCase()}`, (err, data) => {
    let file;
    if (!err) {
      // Creating a readstream containing the file
      let readStream = fs.createReadStream(
        `images/${fileName}.${ext.toLowerCase()}`
      );

      readStream.on("data", function (packet) {
        file = packet;
      });

      readStream.on("close", function () {
        // Sending the response type as 1 bc file has been found
        ITPpacket.init(
          1,
          singleton.getSequenceNumber(),
          singleton.getTimestamp(),
          file,
          file.length
        );
        // Write the packet to the socket and close it
        sock.write(ITPpacket.getPacket());
        sock.end();
      });
    } else {
      // If file isn't read properly, send response packet with "Not found" type (2)
      ITPpacket.init(
        2,
        singleton.getSequenceNumber(),
        singleton.getTimestamp(),
        0,
        0
      );
      // Write the packet to the socket and close it
      sock.write(ITPpacket.getPacket());
      sock.end();

      console.log(err);
    }
  });
};

//// Some usefull methods ////
// Feel free to use them, but DON NOT change or add any code in these methods.

// Returns the integer value of the extracted bits fragment for a given packet
function parseBitPacket(packet, offset, length) {
  let number = "";
  for (var i = 0; i < length; i++) {
    // let us get the actual byte position of the offset
    let bytePosition = Math.floor((offset + i) / 8);
    let bitPosition = 7 - ((offset + i) % 8);
    let bit = (packet[bytePosition] >> bitPosition) % 2;
    number = (number << 1) | bit;
  }
  return number;
}

// Prints the entire packet in bits format
function printPacketBit(packet) {
  var bitString = "";

  for (var i = 0; i < packet.length; i++) {
    // To add leading zeros
    var b = "00000000" + packet[i].toString(2);
    // To print 4 bytes per line
    if (i > 0 && i % 4 == 0) bitString += "\n";
    bitString += " " + b.substr(b.length - 8);
  }
  console.log(bitString);
}

// Converts byte array to string
function bytesToString(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}
