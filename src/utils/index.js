import { removePacket } from '../lib/packet.js';
import COMMANDS from '../lib/commands.js';

export function checkNotEventTCP(data) {
  try {
    data = removePacket(data);
    const commandId = data.readUIntLE(0, 2);

    const event = data.readUIntLE(4, 2);

    return event === COMMANDS.EF_ATTLOG && commandId === COMMANDS.CMD_REG_EVENT;
  } catch (err) {
    console.log(`[228] : ${err.toString()} ,${data.toString('hex')} `);
    return false;
  }
}

export function decodeTCPHeader(header) {
  const recvData = header.subarray(8);
  const payloadSize = header.readUIntLE(4, 2);

  const commandId = recvData.readUIntLE(0, 2);
  const checkSum = recvData.readUIntLE(2, 2);
  const sessionId = recvData.readUIntLE(4, 2);
  const replyId = recvData.readUIntLE(6, 2);
  return { commandId, checkSum, sessionId, replyId, payloadSize };
}

function parseHexToTime(hex) {
  const time = {
    year: hex.readUIntLE(0, 1),
    month: hex.readUIntLE(1, 1),
    date: hex.readUIntLE(2, 1),
    hour: hex.readUIntLE(3, 1),
    minute: hex.readUIntLE(4, 1),
    second: hex.readUIntLE(5, 1),
  };

  return new Date(
    2000 + time.year,
    time.month - 1,
    time.date,
    time.hour,
    time.minute,
    time.second
  );
}

const parseTimeToDate = (time) => {
  const second = time % 60;
  time = (time - second) / 60;
  const minute = time % 60;
  time = (time - minute) / 60;
  const hour = time % 24;
  time = (time - hour) / 24;
  const day = (time % 31) + 1;
  time = (time - (day - 1)) / 31;
  const month = time % 12;
  time = (time - month) / 12;
  const year = time + 2000;

  return new Date(year, month, day, hour, minute, second);
};

export function decodeRecordRealTimeLog52(recordData) {
  const payload = removePacket(recordData);

  const recvData = payload.subarray(8);

  const userSn = recvData.readUIntLE(0, 2);

  const userId = recvData.slice(0, 9).toString('ascii').split('\0').shift();

  const verifyType = recvData.readUIntLE(24, 2); // Correct offset and length
  const attTime = parseHexToTime(recvData.subarray(26, 32)); // 6-byte datetime

  console.log('verifyType', verifyType);
  const VERIY_TYPE = {
    4: 'checkin',
    260: 'checkout',
    1028: 'overtimein',
    1284: 'overtimeout',
  };

  return { userSn, userId, verifyType: VERIY_TYPE[verifyType], attTime };
}
