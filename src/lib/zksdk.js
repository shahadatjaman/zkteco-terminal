import { findLogByRecordTime } from '../utils/index.js';
import { ZKDeviceClient } from './connection.js';
import { ERROR_TYPES, ZKError } from './Error.js';

class ZKSDK {
  constructor(ip, port, timeout, inport) {
    this.connectionType = 'tcp';

    this.zklibTcp = new ZKDeviceClient(ip, port);
    this.interval = null;
    this.timer = null;
    this.isBusy = false;
    this.ip = ip;
    this.isReconnecting = false;
  }

  async functionWrapper(tcpCallback, command) {
    switch (this.connectionType) {
      case 'tcp':
        if (this.zklibTcp.socket) {
          try {
            const res = await tcpCallback();

            return res;
          } catch (err) {
            return Promise.reject(
              new ZKError(err, `[TCP] ${command}`, this.ip)
            );
          }
        } else {
          return Promise.reject(
            new ZKError(new Error(`Socket isn't connected !`), `[TCP]`, this.ip)
          );
        }
      default:
        return Promise.reject(
          new ZKError(new Error(`Socket isn't connected !`), '', this.ip)
        );
    }
  }

  async createSocket(cb) {
    try {
      this.zklibTcp.startHeartbeat(cb);
      this.connectionType = 'tcp';
    } catch (err) {
      try {
        await this.zklibTcp.disconnect();
      } catch {}

      if (err.code !== ERROR_TYPES.ECONNREFUSED) {
        return Promise.reject(new ZKError(err, 'TCP CONNECT', this.ip));
      }
    }
  }

  async disconnect() {
    return await this.functionWrapper(() => this.zklibTcp.disconnect());
  }

  async enableDevice() {
    return await this.functionWrapper(() => this.zklibTcp.enableDevice());
  }

  async executeCmd(command, data = '') {
    return await this.functionWrapper(() =>
      this.zklibTcp.executeCmd(command, data)
    );
  }

  async getRealTimeLogs(cb) {
    console.log('<======Get realtime data from here ======>');
    return await this.functionWrapper(() => this.zklibTcp.getRealTimeLogs(cb));
  }

  async getPIN() {
    return await this.functionWrapper(() => this.zklibTcp.getPIN());
  }

  async setUser(uid, userid, name, password, role = 0, cardno = 0) {
    return await this.functionWrapper(() =>
      this.zklibTcp.setUser(uid, userid, name, password, role, cardno)
    );
  }

  async deleteUser(uid) {
    return await this.functionWrapper(() => this.zklibTcp.deleteUser(uid));
  }

  async getTime() {
    return await this.functionWrapper(() => this.zklibTcp.getTime());
  }

  async getAttendances() {
    const records = await this.zklibTcp.getAttendances();
    return records;
  }

  async clearAttendanceLog() {
    return await this.functionWrapper(() => this.zklibTcp.clearAttendanceLog());
  }

  async getAttendances(cb) {
    return await this.functionWrapper(() => this.zklibTcp.getAttendances(cb));
  }
}

export default ZKSDK;
