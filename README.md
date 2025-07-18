
ZKTecoTerminal
==============

A Node.js client for communicating with ZKTeco standalone attendance devices (e.g., ZKTeco K14, K40, etc.) via TCP/IP.
This package allows developers to interact with biometric attendance terminals by sending raw protocol commands,
retrieving real-time logs, managing users, and accessing attendance records directly.

Features
--------

- TCP Socket Communication with ZKTeco devices
- User Management (create, update, delete users)
- Attendance Log Retrieval (chunked read, buffer parsing)
- Real-Time Log Events support
- Clear Logs & Free Buffers
- Automatic Reconnection & Heartbeat Monitoring
- Device Time Sync & Configuration

Installation
------------

```bash
npm i zkteco-terminal
```

Usage Example
-------------

```js
import zkClient from 'zkteco-terminal';


async function main() {
  const zkClient = new zkClient({ ip: '192.168.1.4', port:4370 });

  try {
    await zkClient.createSocket(async (status) => {
     
      if (status) {
        await zkClient.enableDevice();

        await zkClient.getRealTimeLogs(async (data) => {
          console.log('real time data', data);
        });
      }
    });


  } catch (err) {
    console.error('Failed:', err);
  } finally {
     zkClient.close();
  }
}

main();
```

Supported Methods
-----------------

- createSocket() – Connect to device
- connectWithCmd() – Authenticate communication
- getAttendances() – Get full attendance logs
- getRealTimeLogs(cb) – Subscribe to real-time events
- setUser(uid, userid, name, password, role, cardno) – Create or update user
- deleteUser(uid) – Delete a user by UID
- getTime() – Get device time
- clearAttendanceLog() – Clear all logs
- enableDevice() – Enable device for operation
- disconnect() – Gracefully disconnect the socket

Compatibility
-------------

- Tested with ZKTeco devices that use the ZKProtocol over TCP (e.g., K14, K40, X628-C, etc.)
- Requires Node.js v14+



Getting Started
--------

To get started:

1. **Fork the repository**
2. **Clone your fork**  
   ```bash
   git clone https://github.com/shax26/zkteco-terminal.git


### Executing ZK Protocol Commands

The library includes an `executeCmd` function designed to run ZK protocol commands easily.

You can explore the full list of available commands by visiting the official [ZK Protocol documentation](https://github.com/adrobinoga/zk-protocol/blob/master/protocol.md). Once you've found the command you need, simply pass it into the `executeCmd` function like so:

```js
executeCmd('YourCommandHere');


Notes
-----

- Ensure your ZKTeco device is accessible over LAN and the correct IP/port is set.
- This package communicates directly over raw TCP, not via HTTP or SDK.
- Not affiliated with ZKTeco.

License
-------

MIT