import net from 'net';
import COMMANDS from './commands.js';
import { buildPacket, parseResponse, removePacket } from './packet.js';
import {
  checkNotEventTCP,
  decodeRecordData40,
  decodeRecordRealTimeLog52,
  decodeTCPHeader,
  findLogByRecordTime,
} from '../utils/index.js';

const { CMD_CONNECT, CMD_EXIT, REQUEST_DATA, MAX_CHUNK } = COMMANDS;

export class ZKDeviceClient {
  constructor({ ip, port = 4370, commKey = 0 }) {
    this.ip = ip;
    this.port = port;
    this.commKey = commKey;
    this.socket = null;
    this.sessionId = 0;
    this.replyId = 0;
    this.timeout = 1000;
    this.heartbeatTimer = null;
    this.isReconnecting = false;
  }

  createSocket(cbError, cbClose) {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.once('error', (err) => {
        // console.log('err at 32', err);
        reject(err);
        cbError && cbError(err);
      });

      this.socket.once('connect', () => {
        this.monitorConnection();
        this.startHeartbeat();
        resolve(this.socket);
      });

      this.socket.once('close', (err) => {
        this.socket = null;
        cbClose && cbClose('tcp');
      });

      if (this.timeout) {
        this.socket.setTimeout(this.timeout);
      }

      this.socket.connect(this.port, this.ip);
    });
  }

  monitorConnection(cb) {
    if (!this.socket) return;

    this.socket.removeAllListeners('close');
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('end');

    this.socket.on('close', () => {
      this.handleReconnection(cb);
    });

    this.socket.on('error', (err) => {
      this.handleReconnection(cb);
    });

    this.socket.on('end', () => {
      this.handleReconnection(cb);
    });
  }

  async handleReconnection(cb, delay = 5000) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    while (true) {
      try {
        await this.createSocket();
        await this.connectWithCmd();
        this.monitorConnection(cb);
        this.startHeartbeat(cb);

        this.isReconnecting = false;
        break;
      } catch (err) {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  startHeartbeat(cb = () => {}, interval = 10000) {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    let lastStatus = null; // Track previous connection status

    this.heartbeatTimer = setInterval(async () => {
      if (!this.socket || this.socket.destroyed) {
        if (lastStatus !== false) {
          cb(false); // Emit only if status changed
          lastStatus = false;
        }
        this.handleReconnection(cb);
        return;
      }

      try {
        await this.executeCmd(COMMANDS.CMD_CONNECT);
        if (lastStatus !== true) {
          cb(true); // Emit only if status changed
          lastStatus = true;
        }
      } catch (err) {
        if (lastStatus !== false) {
          cb(false); // Emit only if status changed
          lastStatus = false;
        }
        this.handleReconnection(cb);
      }
    }, interval);
  }

  async connectWithCmd() {
    return new Promise(async (resolve, reject) => {
      try {
        const reply = await this.executeCmd(COMMANDS.CMD_CONNECT, '');
        if (reply) {
          resolve(true);
        } else {
          reject(new Error('NO_REPLY_ON_CMD_CONNECT'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  writeMessage(msg, isConnectPhase = false) {
    return new Promise((resolve, reject) => {
      let timer = null;

      this.socket.once('data', (data) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      });

      this.socket.write(msg, null, (err) => {
        if (err) {
          return reject(err);
        }

        if (this.socket.timeout || isConnectPhase) {
          timer = setTimeout(
            () => {
              clearTimeout(timer);
              reject(new Error('TIMEOUT_ON_WRITING_MESSAGE'));
            },
            isConnectPhase ? 2000 : this.socket.timeout
          );
        }
      });
    });
  }

  /**
   * Executes a command on the device using raw TCP protocol.
   * @param {number} command - The command code from COMMANDS.
   * @param {Buffer} data - The payload to send.
   * @returns {Promise<Buffer>} - The cleaned response buffer.
   */
  executeCmd(command, data = '') {
    return new Promise(async (resolve, reject) => {
      try {
        if (command === CMD_CONNECT) {
          this.sessionId = 0;
          this.replyId = 0;
        } else {
          this.replyId++;
        }

        const packet = buildPacket(command, data, this.sessionId, this.replyId);

        const response = await this.writeMessage(
          packet,
          command === CMD_CONNECT || command === CMD_EXIT
        );

        const cleaned = removePacket(response);

        if (cleaned && cleaned.length >= 0) {
          if (command === CMD_CONNECT) {
            this.sessionId = cleaned.readUInt16LE(4); // Update session ID from response
          }
        }

        resolve(cleaned);
      } catch (err) {
        reject(err);
      }
    });
  }

  close() {
    if (this.socket) {
      this.socket.destroy();
      console.log('🔌 Socket connection closed.');
    }
  }

  closeSocket() {
    return new Promise((resolve, reject) => {
      this.socket.removeAllListeners('data');
      this.socket.end(() => {
        clearTimeout(timer);
        resolve(true);
      });
      /**
       * When socket isn't connected so this.socket.end will never resolve
       * we use settimeout for handling this case
       */
      const timer = setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }

  requestData(msg) {
    return new Promise((resolve, reject) => {
      let timer = null;
      let replyBuffer = Buffer.from([]);
      const internalCallback = (data) => {
        this.socket.removeListener('data', handleOnData);
        timer && clearTimeout(timer);
        resolve(data);
      };

      const handleOnData = (data) => {
        replyBuffer = Buffer.concat([replyBuffer, data]);
        if (checkNotEventTCP(data)) return;
        clearTimeout(timer);
        const header = decodeTCPHeader(replyBuffer.subarray(0, 16));

        if (header.commandId === COMMANDS.CMD_DATA) {
          timer = setTimeout(() => {
            internalCallback(replyBuffer);
          }, 1000);
        } else {
          timer = setTimeout(() => {
            reject(new Error('TIMEOUT_ON_RECEIVING_REQUEST_DATA'));
          }, this.timeout);

          const packetLength = data.readUIntLE(4, 2);
          if (packetLength > 8) {
            internalCallback(data);
          }
        }
      };

      this.socket.on('data', handleOnData);

      this.socket.write(msg, null, (err) => {
        if (err) {
          reject(err);
        }

        timer = setTimeout(() => {
          reject(Error('TIMEOUT_IN_RECEIVING_RESPONSE_AFTER_REQUESTING_DATA'));
        }, this.timeout);
      });
    });
  }

  sendChunkRequest(start, size) {
    this.replyId++;
    const reqData = Buffer.alloc(8);
    reqData.writeUInt32LE(start, 0);
    reqData.writeUInt32LE(size, 4);
    const buf = buildPacket(
      COMMANDS.CMD_DATA_RDY,
      reqData,
      this.sessionId,
      this.replyId
    );

    this.socket.write(buf, null, (err) => {
      if (err) {
        log(`[TCP][SEND_CHUNK_REQUEST]` + err.toString());
      }
    });
  }

  readWithBuffer(reqData, cb = null) {
    return new Promise(async (resolve, reject) => {
      this.replyId++;
      const buf = buildPacket(
        COMMANDS.CMD_DATA_WRRQ,
        reqData,
        this.sessionId,
        this.replyId
      );
      let reply = null;

      try {
        reply = await this.requestData(buf);
      } catch (err) {
        reject(err);
      }

      const header = decodeTCPHeader(reply.subarray(0, 16));
      switch (header.commandId) {
        case COMMANDS.CMD_DATA: {
          resolve({ data: reply.subarray(16), mode: 8 });
          break;
        }
        case COMMANDS.CMD_ACK_OK:
        case COMMANDS.CMD_PREPARE_DATA: {
          // this case show that data is prepared => send command to get these data
          // reply variable includes information about the size of following data
          const recvData = reply.subarray(16);
          const size = recvData.readUIntLE(1, 4);

          // We need to split the data to many chunks to receive , because it's to large
          // After receiving all chunk data , we concat it to TotalBuffer variable , that 's the data we want
          let remain = size % MAX_CHUNK;
          let numberChunks = Math.round(size - remain) / MAX_CHUNK;
          let totalPackets = numberChunks + (remain > 0 ? 1 : 0);
          let replyData = Buffer.from([]);

          let totalBuffer = Buffer.from([]);
          let realTotalBuffer = Buffer.from([]);

          const timeout = 10000;
          let timer = setTimeout(() => {
            internalCallback(
              replyData,
              new Error('TIMEOUT WHEN RECEIVING PACKET')
            );
          }, timeout);

          const internalCallback = (replyData, err = null) => {
            // this.socket && this.socket.removeListener('data', handleOnData)
            timer && clearTimeout(timer);
            resolve({ data: replyData, err });
          };

          const handleOnData = (reply) => {
            if (checkNotEventTCP(reply)) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
              internalCallback(
                replyData,
                new Error(`TIME OUT !! ${totalPackets} PACKETS REMAIN !`)
              );
            }, timeout);

            totalBuffer = Buffer.concat([totalBuffer, reply]);
            const packetLength = totalBuffer.readUIntLE(4, 2);
            if (totalBuffer.length >= 8 + packetLength) {
              realTotalBuffer = Buffer.concat([
                realTotalBuffer,
                totalBuffer.subarray(16, 8 + packetLength),
              ]);
              totalBuffer = totalBuffer.subarray(8 + packetLength);

              if (
                (totalPackets > 1 &&
                  realTotalBuffer.length === MAX_CHUNK + 8) ||
                (totalPackets === 1 && realTotalBuffer.length === remain + 8)
              ) {
                replyData = Buffer.concat([
                  replyData,
                  realTotalBuffer.subarray(8),
                ]);
                totalBuffer = Buffer.from([]);
                realTotalBuffer = Buffer.from([]);

                totalPackets -= 1;
                cb && cb(replyData.length, size);

                if (totalPackets <= 0) {
                  internalCallback(replyData);
                }
              }
            }
          };

          this.socket.once('close', () => {
            internalCallback(
              replyData,
              new Error('Socket is disconnected unexpectedly')
            );
          });

          this.socket.on('data', handleOnData);

          for (let i = 0; i <= numberChunks; i++) {
            if (i === numberChunks) {
              this.sendChunkRequest(numberChunks * MAX_CHUNK, remain);
            } else {
              this.sendChunkRequest(i * MAX_CHUNK, MAX_CHUNK);
            }
          }

          break;
        }
        default: {
          reject(
            new Error(
              'ERROR_IN_UNHANDLE_CMD ' + exportErrorMessage(header.commandId)
            )
          );
        }
      }
    });
  }

  async freeData() {
    return await this.executeCmd(COMMANDS.CMD_FREE_DATA, '');
  }

  async getRealTimeLogs(cb = () => {}) {
    this.replyId++;

    const buf = buildPacket(
      COMMANDS.CMD_REG_EVENT,
      REQUEST_DATA.GET_REAL_TIME_EVENT,
      this.sessionId,
      this.replyId
    );

    this.socket.write(buf, null, (err) => {
      if (err) {
        console.log('error ar 405', err);
      }
    });

    this.socket.listenerCount('data') === 0 &&
      this.socket.on('data', async (data) => {
        if (!checkNotEventTCP(data)) return;

        if (data.length > 16) {
          const docodedData = decodeRecordRealTimeLog52(data);

          const logs = await this.getAttendances();

          const relaTimeData = findLogByRecordTime(docodedData, logs.data);

          cb(relaTimeData);
        }
      });
  }

  async setUser(uid, userid, name, password, role = 0, cardno = 0) {
    try {
      // Validate input parameters
      if (
        parseInt(uid) <= 0 ||
        parseInt(uid) > 3000 ||
        userid.length > 9 ||
        name.length > 24 ||
        password.length > 8 ||
        cardno.toString().length > 10
      ) {
        throw new Error('Invalid input parameters');
      }

      // Allocate and initialize the buffer
      const commandBuffer = Buffer.alloc(72);

      // Fill the buffer with user data
      commandBuffer.writeUInt16LE(parseInt(uid), 0);
      commandBuffer.writeUInt16LE(role, 2);
      commandBuffer.write(password.padEnd(8, '\0'), 3, 8); // Ensure password is 8 bytes
      commandBuffer.write(name.padEnd(24, '\0'), 11, 24); // Ensure name is 24 bytes
      commandBuffer.writeUInt16LE(parseInt(cardno), 35);
      commandBuffer.writeUInt32LE(0, 40); // Placeholder or reserved field
      commandBuffer.write(userid.padEnd(9, '\0'), 48, 9); // Ensure userid is 9 bytes

      // Send the command and return the result
      return await this.executeCmd(COMMANDS.CMD_USER_WRQ, commandBuffer);
    } catch (err) {
      // Log error details for debugging
      console.error('Error setting user:', err);

      // Re-throw error for upstream handling
      throw err;
    }
  }

  async deleteUser(uid) {
    try {
      // Validate input parameter
      if (parseInt(uid) >= 0 || parseInt(uid) > 3000) {
        throw new Error('Invalid UID: must be between 1 and 3000');
      }

      // Allocate and initialize the buffer
      const commandBuffer = Buffer.alloc(72);

      // Write UID to the buffer
      commandBuffer.writeUInt16LE(parseInt(uid), 0);

      // Send the delete command and return the result
      return await this.executeCmd(COMMANDS.CMD_DELETE_USER, commandBuffer);
    } catch (err) {
      // Log error details for debugging
      console.error('Error deleting user:', err);

      // Re-throw error for upstream handling
      throw err;
    }
  }

  async enableDevice() {
    try {
      return await this.executeCmd(COMMANDS.CMD_ENABLEDEVICE, '');
    } catch (err) {
      console.error('Error enabling device:', err);
      throw err; // Optionally, re-throw the error if you need to handle it upstream
    }
  }

  async getPIN() {
    const keyword = '~PIN2Width';

    try {
      // Execute the command to get the PIN information
      const data = await this.executeCmd(COMMANDS.CMD_OPTIONS_RRQ, keyword);

      // Extract and format the PIN information from the response data
      const pin = data
        .slice(8) // Skip the first 8 bytes (header)
        .toString('ascii') // Convert buffer to ASCII string
        .replace(`${keyword}=`, '') // Remove the keyword prefix
        .replace(/\u0000/g, ''); // Remove null characters

      return pin;
    } catch (err) {
      // Log the error for debugging
      console.error('Error getting PIN:', err);
      // Re-throw the error to be handled by the caller
      throw err;
    }
  }

  async disconnect() {
    try {
      await this.executeCmd(COMMANDS.CMD_EXIT, '');
    } catch (err) {}
    return await this.closeSocket();
  }

  async getTime() {
    try {
      // Execute the command to get the current time
      const response = await this.executeCmd(COMMANDS.CMD_GET_TIME, '');

      // Check if the response is valid
      if (!response || response.length < 12) {
        throw new Error('Invalid response received for time command');
      }

      // Extract and decode the time value from the response
      const timeValue = response.readUInt32LE(8); // Read 4 bytes starting at offset 8
      return timeParser.decode(timeValue); // Parse and return the decoded time
    } catch (err) {
      // Log the error for debugging
      console.error('Error getting time:', err);

      // Re-throw the error for the caller to handle
      throw err;
    }
  }

  async clearAttendanceLog() {
    try {
      // Execute the command to clear attendance logs
      return await this.executeCmd(COMMANDS.CMD_CLEAR_ATTLOG, '');
    } catch (err) {
      // Log the error for debugging purposes
      console.error('Error clearing attendance log:', err);
      // Re-throw the error to be handled by the caller
      throw err;
    }
  }

  async getAttendances(callbackInProcess = () => {}) {
    try {
      // Free any existing buffer data to prepare for a new request
      if (this.socket) {
        await this.freeData();
      }

      // Request attendance logs and handle chunked data
      const data = await this.readWithBuffer(
        REQUEST_DATA.GET_ATTENDANCE_LOGS,
        callbackInProcess
      );

      // Free buffer data after receiving the attendance logs
      if (this.socket) {
        await this.freeData();
      }

      // Constants for record processing
      const RECORD_PACKET_SIZE = 40;

      // Ensure data.data is a valid buffer
      if (!data.data || !(data.data instanceof Buffer)) {
        throw new Error('Invalid data received');
      }

      // Process the record data
      let recordData = data.data.subarray(4); // Skip header
      const records = [];

      // Process each attendance record
      while (recordData.length >= RECORD_PACKET_SIZE) {
        const record = decodeRecordData40(
          recordData.subarray(0, RECORD_PACKET_SIZE)
        );
        records.push({ ...record }); // Add IP address to each record
        recordData = recordData.subarray(RECORD_PACKET_SIZE); // Move to the next packet
      }

      // Return the list of attendance records
      return { data: records };
    } catch (err) {
      // Log and re-throw the error
      console.error('Error getting attendance records:', err);
      throw err; // Re-throw the error for handling by the caller
    }
  }
}
