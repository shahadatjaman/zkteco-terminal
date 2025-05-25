import { buildPacket, parseResponse } from './packet.js';

import COMMANDS from './commands.js';
const { CMD_DISABLEDEVICE, CMD_ENABLEDEVICE,CMD_DATA_WRRQ, CMD_DATA } = COMMANDS;

const USER_DATA_REQUEST = Buffer.from('0109000500000000000000', 'hex');

export async function getAllUsers(socket, sessionId, replyId) {
  // Step 1: Disable device
  socket.write(buildPacket(CMD_DISABLEDEVICE, Buffer.alloc(0), sessionId, replyId++));

  // Step 2: Request user data
  socket.write(buildPacket(CMD_DATA_WRRQ, USER_DATA_REQUEST, sessionId, replyId++));

  return new Promise((resolve) => {
    socket.once('data', (response) => {
      const { command, data } = parseResponse(response);
      if (command !== CMD_DATA) return resolve([]);

      const users = [];
      const count = data.readUInt32LE(0);
      for (let offset = 4; offset < count + 4; offset += 72) {
        const entry = data.slice(offset, offset + 72);
        const id = entry.slice(48, 57).toString().replace(/\0/g, '');
        const name = entry.slice(11, 35).toString().replace(/\0/g, '');
        users.push({ id, name });
      }

      // Step 3: Enable device
      socket.write(buildPacket(CMD_ENABLEDEVICE, Buffer.alloc(0), sessionId, replyId++));

      resolve(users);
    });
  });
}

