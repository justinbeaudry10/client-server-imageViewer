const ITPpacket = require("./ITPResponse");
const singleton = require("./Singleton");
const fs = require("fs");

module.exports = {
  handleClientJoining: function (sock) {
    let curTime = singleton.getTimestamp();

    console.log(`\nClient-${curTime} is connected at timestamp: ${curTime}`);

    sock.on("data", (reqPkt) => {
      console.log("ITP packet received:");
      printPacketBit(reqPkt);

      let version = parseBitPacket(reqPkt, 0, 4); // Should be 7
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

      getImage(fileName, fileExt, sock);
    });

    // Close the connection
    sock.on("close", () => {
      console.log(`\nClient-${curTime} closed the connection`);
    });
  },
};

const getImage = (fileName, ext, sock) => {
  fs.readFile(`images/${fileName}.${ext.toLowerCase()}`, (err, data) => {
    const filePartitions = [];
    if (!err) {
      //Creating a readstream containing the file
      var readFile = fs.createReadStream(
        `images/${fileName}.${ext.toLowerCase()}`
      );
      //If there is no error in reading the file, put the file partitions into the array
      readFile.on("data", function (partition) {
        filePartitions.push(partition);
      });
      //Concatonate the file parts and send the ITPResponse backet the needed information fields
      readFile.on("close", function () {
        let file = Buffer.concat(filePartitions);
        //Sending the request type as 1 to indicate that the file has been found
        ITPpacket.init(
          1,
          singleton.getSequenceNumber(),
          singleton.getTimestamp(),
          file,
          file.length
        );
        //Calling the get packet function
        sock.write(ITPpacket.getPacket());
        //Closing socket connection
        sock.end();
      });
    } else {
      //If the file is not successfully read, that means it doesn't exist in the server images folder
      //Handle by sending not-found code '2' with an empty file
      ITPpacket.init(
        2,
        singleton.getSequenceNumber(),
        singleton.getTimestamp(),
        0,
        0
      );
      //Initiate socket connection to send empty file
      sock.write(ITPpacket.getPacket());
      //Ending socket connection
      sock.end();

      console.log("\n Error in reading client file, file not found");
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
