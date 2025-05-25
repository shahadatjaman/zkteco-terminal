import { USHRT_MAX } from "zkteco-lib/constants.js";
import  calculateChecksum  from "./checksum.js";


// export function buildPacket(command, data, sessionId, replyId) {


//   const dataBuffer = Buffer.from(data);
//   const payload = Buffer.alloc(8 + dataBuffer.length);

//   payload.writeUInt16LE(command, 0);               // 2 bytes
//   payload.writeUInt16LE(0, 2);                     // placeholder for checksum
//   payload.writeUInt16LE(sessionId, 4);             // 2 bytes
//   payload.writeUInt16LE(replyId, 6);               // 2 bytes
//   dataBuffer.copy(payload, 8);                           // payload data if any

//   const checksum = calculateChecksum(payload);
//   console.log('checksum',checksum);
//   payload.writeUInt16LE(checksum, 2);              // now write correct checksum


//   replyId = (replyId + 1) % USHRT_MAX;
//   payload.writeUInt16LE(replyId, 6);


//   // const header = Buffer.alloc(8);
//   // header.writeUInt32BE(0x5050827d, 0);  // ✅ correct endian order
//   // header.writeUInt32LE(payload.length, 4);           // Full 4-byte length

//   // return Buffer.concat([header, payload]);

//     const prefixBuf = Buffer.from([
//     0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00,
//   ]);

//   prefixBuf.writeUInt16LE(payload.length, 4);

//   return Buffer.concat([prefixBuf, payload]);



//   // const header = Buffer.alloc(8);
//   // header.writeUInt32LE(0x5050827d, 0);             // ZKTeco magic
//   // header.writeUInt32LE(payload.length, 4);         // payload length


//     // const prefixBuf = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00])
  
//     // prefixBuf.writeUInt16LE(payload.length, 4)
  
//     // return Buffer.concat([prefixBuf, payload]);
// }


const createChkSum = (buf) => {
  try {
    let chksum = 0;
    for (let i = 0; i < buf.length; i += 2) {
      if (i == buf.length - 1) {
        chksum += buf[i];
      } else {
        chksum += buf.readUInt16LE(i);
      }
      chksum %= USHRT_MAX;
    }
    chksum = USHRT_MAX - chksum - 1;

    return chksum;
  } catch (error) {
    throw new Error(error);
  }
};


export function buildPacket(command, data,sessionId, replyId){
  const dataBuffer = Buffer.from(data);
  const buf = Buffer.alloc(8 + dataBuffer.length);

  buf.writeUInt16LE(command, 0);
  buf.writeUInt16LE(0, 2);

  buf.writeUInt16LE(sessionId, 4);
  buf.writeUInt16LE(replyId, 6);
  dataBuffer.copy(buf, 8);

  const chksum2 = createChkSum(buf);
  buf.writeUInt16LE(chksum2, 2);

  replyId = (replyId + 1) % USHRT_MAX;
  buf.writeUInt16LE(replyId, 6);

  const prefixBuf = Buffer.from([
    0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00,
  ]);

  prefixBuf.writeUInt16LE(buf.length, 4);

  return Buffer.concat([prefixBuf, buf]);
};

export function removePacket(buf){
  if (buf.length < 8) {
      return buf;
    }
  
    if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) {
      return buf;
    }
  
    return buf.slice(8);
}

export function parseResponse(buffer) {
  const payload = buffer.slice(8);
  const command = payload.readUInt16LE(0);
  const sessionId = payload.readUInt16LE(4);
  const replyId = payload.readUInt16LE(6);
  const data = payload.slice(8);
  return { command, sessionId, replyId, data };
}


