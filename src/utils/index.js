import { removePacket } from "../lib/packet.js"
import COMMANDS from '../lib/commands.js';

export function checkNotEventTCP(data){
  try{
    data = removePacket(data)
    const commandId = data.readUIntLE(0,2)
    const event = data.readUIntLE(4,2)
    return event === COMMANDS.EF_ATTLOG && commandId === COMMANDS.CMD_REG_EVENT
  }catch(err){
    console.log(`[228] : ${err.toString()} ,${data.toString('hex')} `)
    return false 
  }
}

export function decodeTCPHeader(header){
    const recvData = header.subarray(8)
    const payloadSize = header.readUIntLE(4,2)

    const commandId = recvData.readUIntLE(0,2)
    const checkSum = recvData.readUIntLE(2,2)
    const sessionId = recvData.readUIntLE(4,2)
    const replyId = recvData.readUIntLE(6,2)
    return { commandId , checkSum , sessionId , replyId , payloadSize }

}


function parseHexToTime(hex){
    const time =  {
        year: hex.readUIntLE(0,1),
        month:hex.readUIntLE(1,1),
        date: hex.readUIntLE(2,1),
        hour: hex.readUIntLE(3,1),
        minute: hex.readUIntLE(4,1),
        second: hex.readUIntLE(5,1)
      }
    
      return new Date(2000+ time.year, time.month - 1 , time.date, time.hour, time.minute, time.second)
}


export function decodeRecordRealTimeLog52(recordData){
  const payload = removePacket(recordData)
        
  const recvData = payload.subarray(8)

  const userId = recvData.slice(0 , 9)
  .toString('ascii')
  .split('\0')
  .shift()
  

  const attTime = parseHexToTime(recvData.subarray(26,26+6))

  return { userId, attTime}

}