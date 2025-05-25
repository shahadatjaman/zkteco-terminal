import { buildPacket, parseResponse } from './packet.js';
import COMMANDS from './commands.js';
const { CMD_REG_EVENT, CMD_ACK_OK } = COMMANDS;

const EVENT_REGISTER = Buffer.from('ffff0000', 'hex');

export function startRealtimeListener(socket, sessionId, onEvent) {
  socket.write(buildPacket(CMD_REG_EVENT, EVENT_REGISTER, sessionId, 0));

  socket.on('data', (raw) => {
    const packet = parseResponse(raw);
    if (packet.command === 0x01f4) { // CMD_REG_EVENT
      const eventCode = packet.sessionId; // reused for event ID
      const payload = packet.data;
      onEvent({ eventCode, payload });
    } else if (packet.command === CMD_ACK_OK) {
      // Device acknowledged CMD_REG_EVENT
    }
  });
}

