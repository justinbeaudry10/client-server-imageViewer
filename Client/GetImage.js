const net = require("net");
const fs = require("fs");
const open = require("open");
const ITPpacket = require("./ITPRequest");

// process.argv parses command line arguments
// Args: [nodePath, path, '-s', ip:port, '-q', fileName, '-v', version]
const [host, port] = process.argv[3].split(":");
const [fileName, fileExt] = process.argv[5].split(".");
const version = Number(process.argv[7]);

ITPpacket.init(version, 0, fileExt, fileName);

let client = new net.Socket();

client.connect(port, host, () => {
  console.log("Connected to ImageDB server on: " + host + ":" + port);
  client.write(ITPpacket.getBytePacket());
});

//Creating an array to hold all the partitions of the file
const filePartitions = [];
//When the client receives data, it splits the data into partitions
client.on("data", (partition) => filePartitions.push(partition));

client.on("end", () => {
  const resPkt = Buffer.concat(filePartitions);
  let header = resPkt.slice(0, 12);
  let img = resPkt.slice(12);
  let resTypeInt = parseBitPacket(resPkt, 4, 8);

  if (resTypeInt === 1) {
    let fullFileName = fileName + "." + fileExt;

    fs.writeFile(fullFileName, img, "binary", (err) => {
      if (err) {
        console.log(err);
      } else {
        open(fullFileName);
      }
    });
  }

  let resVersion = parseBitPacket(resPkt, 0, 4);
  let resSeqNum = parseBitPacket(resPkt, 12, 20);
  let resTimestamp = parseBitPacket(resPkt, 32, 32);

  let resType;
  switch (resTypeInt) {
    case 0:
      resType = "Query";
      break;
    case 1:
      resType = "Found";
      break;
    case 2:
      resType = "Not found";
      break;
    case 3:
      resType = "Busy";
      break;
  }

  console.log("ITP packet header received:");
  printPacketBit(header);
  console.log(`\nServer sent:
    --ITP version = ${resVersion}
    --Response Type = ${resType}
    --Sequence Number = ${resSeqNum}
    --Timestamp = ${resTimestamp}`);

  client.end();
});

//Display when socket is disconnected
client.on("end", () => {
  console.log("\nDisconnected from the server");
});

//Display when socket is closed
client.on("close", function () {
  console.log("\nConnection closed");
});

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
