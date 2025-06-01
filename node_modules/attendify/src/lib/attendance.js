import { buildPacket, parseResponse } from './packet.js';

import COMMANDS from './commands.js';
const { CMD_DISABLEDEVICE, CMD_ENABLEDEVICE, CMD_DATA_WRRQ, CMD_DATA } = COMMANDS;


const ATT_DATA_REQUEST = Buffer.from('010d000000000000000000', 'hex');

export async function getAttendanceLogs(socket, sessionId, replyId) {
  // Step 1: Disable device
  socket.write(buildPacket(CMD_DISABLEDEVICE, Buffer.alloc(0), sessionId, replyId++));

  // Step 2: Request attendance logs
  socket.write(buildPacket(CMD_DATA_WRRQ, ATT_DATA_REQUEST, sessionId, replyId++));

  return new Promise((resolve) => {
    socket.once('data', (response) => {
      const { command, data } = parseResponse(response);
      if (command !== 0x05dd) return resolve([]); // CMD_DATA

      const logs = [];
      const count = data.readUInt32LE(0);
      for (let offset = 4; offset < count + 4; offset += 40) {
        const entry = data.slice(offset, offset + 40);
        const userId = entry.slice(2, 11).toString().replace(/\0/g, '');
        const timestamp = entry.readUInt32LE(27);
        logs.push({ userId, timestamp });
      }

      // Step 3: Enable device
      socket.write(buildPacket(CMD_ENABLEDEVICE, Buffer.alloc(0), sessionId, replyId++));

      resolve(logs);
    });
  });
}

