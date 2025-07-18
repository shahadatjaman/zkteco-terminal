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

function convertUTCtoBDTime(utcString) {
  // Create a Date object from the input UTC string
  const date = new Date(utcString);

  // Options for toLocaleString to format in BD timezone with weekday, month, day, year, time and timezone name
  const options = {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'long',
  };

  // Format the date string
  const formatted = date.toLocaleString('en-US', options);

  // Convert the formatted string like: "Wed, Jun 18, 2025, 19:01:54 Bangladesh Standard Time"
  // into "Wed Jun 18 2025 19:01:54 GMT+0600 (Bangladesh Standard Time)"

  // Let's parse the parts:
  const [weekday, month, day, year, time, ...tzParts] = formatted
    .replace(',', '')
    .split(' ');
  const timeString = time;
  const timeZoneName = tzParts.join(' ');

  // Get offset hours and minutes (+0600)
  // We'll calculate offset manually
  const offsetMinutes = date.getTimezoneOffset() - 6 * 60;
  // But getTimezoneOffset returns offset from UTC in minutes for local machine,
  // So better to get offset from the date in BD timezone:
  // We'll calculate offset manually below:

  // To get the GMT+0600 string, let's create a new Date object in BD timezone and get offset:

  // A simpler way: since BD is always +6:00 UTC, we can hardcode offset:
  const gmtOffset = 'GMT+0600';

  // Assemble final string
  return `${weekday} ${month} ${day} ${year} ${timeString} ${gmtOffset} (${timeZoneName})`;
}

export function decode(time) {
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
}

export function encode(date) {
  return (
    ((date.getFullYear() % 100) * 12 * 31 +
      date.getMonth() * 31 +
      date.getDate() -
      1) *
      (24 * 60 * 60) +
    (date.getHours() * 60 + date.getMinutes()) * 60 +
    date.getSeconds()
  );
}

const utcDate = '2025-06-18T13:01:54.000Z';
console.log(convertUTCtoBDTime(utcDate));

export function decodeRecordRealTimeLog52(recordData) {
  const payload = removePacket(recordData);

  function toBangladeshTime(dateString) {
    const date = new Date(dateString);
    // UTC + 6 hours for BD
    const bdOffset = 6 * 60; // in minutes
    const bdTime = new Date(date.getTime() + bdOffset * 60 * 1000);
    return bdTime;
  }

  // Example usage:

  const recvData = payload.subarray(8);

  const userSn = recvData.readUIntLE(0, 2);

  const userId = recvData.slice(0, 9).toString('ascii').split('\0').shift();

  const attTime = parseHexToTime(recvData.subarray(26, 32)); // 6-byte datetime

  const VERIY_TYPE = {
    4: 'checkin',
    260: 'checkout',
    1028: 'overtimein',
    1284: 'overtimeout',
  };

  const bdDate = convertUTCtoBDTime(attTime);

  return { userSn, userId, recordTime: bdDate };
}

export function decodeRecordData40(recordData) {
  const record = {
    userSn: recordData.readUIntLE(0, 2),
    verifyType: recordData.readUIntLE(26, 1),
    verify_state: recordData.readUIntLE(31, 1),
    deviceUserId: recordData
      .slice(2, 2 + 9)
      .toString('ascii')
      .split('\0')
      .shift(),
    recordTime: parseTimeToDate(recordData.readUInt32LE(27)).toString(),
  };
  return record;
}

function toBDTimeMillisFromUTC(dateStr) {
  // For UTC ISO strings like targetDate
  const date = new Date(dateStr);
  return date.getTime() + 6 * 60 * 60 * 1000; // Add 6 hours
}

function toBDTimeMillisFromBDString(bdDateStr) {
  // For record.recordTime strings which are already BD time zone
  const date = new Date(bdDateStr);
  return date.getTime(); // no extra offset!
}

export function findLogByRecordTime(realTimeData, logs) {
  const targetUserId = realTimeData.userId;
  const targetDate = new Date(realTimeData.recordTime);

  for (const log of logs) {
    const logDate = new Date(log.recordTime);

    const isSameUser = log.deviceUserId === targetUserId;
    const isSameTime =
      Math.floor(logDate.getTime() / 1000) ===
      Math.floor(targetDate.getTime() / 1000);

    if (isSameUser && isSameTime) {
      return log;
    }
  }

  return null; // No match found
}

export function decodeUserData72(userData) {
  const user = {
    uid: userData.readUIntLE(0, 2),
    role: userData.readUIntLE(2, 1),
    password: userData
      .subarray(3, 3 + 8)
      .toString('ascii')
      .split('\0')
      .shift(),
    name: userData.slice(11).toString('ascii').split('\0').shift(),
    cardno: userData.readUIntLE(35, 4),
    userId: userData
      .slice(48, 48 + 9)
      .toString('ascii')
      .split('\0')
      .shift(),
  };
  return user;
}
