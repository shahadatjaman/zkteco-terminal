
// export default {
//   // Connection
//   CMD_CONNECT: 0x03e8,
//   CMD_EXIT: 0x03e9,
//   CMD_AUTH: 0x044e,
  
//   // Device control
//   CMD_ENABLEDEVICE: 0x03ea,
//   CMD_DISABLEDEVICE: 0x03eb,
//   CMD_RESTART: 0x03ec,
//   CMD_POWEROFF: 0x03ed,
//   CMD_SLEEP: 0x03ee,
//   CMD_RESUME: 0x03ef,
//   // Data transmission
//   CMD_DATA_WRRQ: 0x05df,
//   CMD_DATA_RDY: 0x05e0,
//   CMD_DATA: 0x05dd,
//   CMD_PREPARE_DATA: 0x05dc,
//   CMD_FREE_DATA: 0x05de,

//   // User operations
//   CMD_USER_WRQ: 0x0008,
//   CMD_DELETE_USER: 0x0012,
//   CMD_DELETE_USERTEMP: 0x0013,
//   CMD_USERTEMP_RRQ: 0x0009,
//   CMD_USERTEMP_WRQ: 0x000a,
//   CMD_VERIFY_WRQ: 0x004f,
//   CMD_VERIFY_RRQ: 0x0050,
//   CMD_USERGRP_RRQ: 0x0015,
//   CMD_USERGRP_WRQ: 0x0016,
//   CMD_USERTZ_RRQ: 0x0017,
//   CMD_USERTZ_WRQ: 0x0018,

//   // Attendance
//   CMD_ATTLOG_RRQ: 0x000d,
//   CMD_CLEAR_ATTLOG: 0x000f,
  
//   // Admin
//   CMD_CLEAR_ADMIN: 0x0014,

//   // Access control
//   CMD_ULG_RRQ: 0x001d,
//   CMD_ULG_WRQ: 0x001e,
//   CMD_TZ_RRQ: 0x001b,
//   CMD_TZ_WRQ: 0x001c,
//   CMD_GRPTZ_RRQ: 0x0019,
//   CMD_GRPTZ_WRQ: 0x001a,
//   CMD_UNLOCK: 0x001f,
//   CMD_DOORSTATE_RRQ: 0x004b,

//   // Realtime
//   CMD_REG_EVENT: 0x01f4,

//   // Acknowledgements
//   CMD_ACK_OK: 0x07d0,
//   CMD_ACK_ERROR: 0x07d1,
//   CMD_ACK_DATA: 0x07d2,
//   CMD_ACK_RETRY: 0x07d3,
//   CMD_ACK_REPEAT: 0x07d4,
//   CMD_ACK_UNAUTH: 0x07d5,
//   CMD_ACK_UNKNOWN: 0xffff,
//   CMD_ACK_ERROR_CMD: 0xfffd,
//   CMD_ACK_ERROR_INIT: 0xfffc,
//   CMD_ACK_ERROR_DATA: 0xfffb,
// };



export default {
  // Connection
  CMD_CONNECT: 1000,
  CMD_EXIT: 1001,
  CMD_AUTH: 1102,

  // Device control
  CMD_ENABLEDEVICE: 1002,
  CMD_DISABLEDEVICE: 1003,
  CMD_RESTART: 1004,
  CMD_POWEROFF: 1005,
  CMD_SLEEP: 1006,
  CMD_RESUME: 1007,

  // Data transmission
  CMD_DATA_WRRQ: 1503,
  CMD_DATA_RDY: 1504,
  CMD_DATA: 1501,
  CMD_PREPARE_DATA: 1500,
  CMD_FREE_DATA: 1502,

  // User operations
  CMD_USER_WRQ: 8,
  CMD_DELETE_USER: 18,
  CMD_DELETE_USERTEMP: 19,
  CMD_USERTEMP_RRQ: 9,
  CMD_USERTEMP_WRQ: 10,
  CMD_VERIFY_WRQ: 79,
  CMD_VERIFY_RRQ: 80,
  CMD_USERGRP_RRQ: 21,
  CMD_USERGRP_WRQ: 22,
  CMD_USERTZ_RRQ: 23,
  CMD_USERTZ_WRQ: 24,
  CMD_GET_FREE_SIZES:50,

  // Attendance
  CMD_ATTLOG_RRQ: 13,
  CMD_CLEAR_ATTLOG: 15,

  // Admin
  CMD_CLEAR_ADMIN: 20,

  // Access control
  CMD_ULG_RRQ: 29,
  CMD_ULG_WRQ: 30,
  CMD_TZ_RRQ: 27,
  CMD_TZ_WRQ: 28,
  CMD_GRPTZ_RRQ: 25,
  CMD_GRPTZ_WRQ: 26,
  CMD_UNLOCK: 31,
  CMD_DOORSTATE_RRQ: 75,

  // Realtime
  CMD_REG_EVENT: 500,

  // Acknowledgements
  CMD_ACK_OK: 2000,
  CMD_ACK_ERROR: 2001,
  CMD_ACK_DATA: 2002,
  CMD_ACK_RETRY: 2003,
  CMD_ACK_REPEAT: 2004,
  CMD_ACK_UNAUTH: 2005,
  CMD_ACK_UNKNOWN: 65535,
  CMD_ACK_ERROR_CMD: 65533,
  CMD_ACK_ERROR_INIT: 65532,
  CMD_ACK_ERROR_DATA: 65531,


  DISABLE_DEVICE: Buffer.from([0, 0, 0, 0]),
  GET_REAL_TIME_EVENT: Buffer.from([0x01, 0x00, 0x00, 0x00]),
  GET_ATTENDANCE_LOGS: Buffer.from([
    0x01, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]),
  GET_USERS: Buffer.from([
    0x01, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]),
};
