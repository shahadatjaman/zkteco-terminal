import {ZKDeviceClient} from './connection.js';
import { ERROR_TYPES,ZKError } from './Error.js';


class ZKSDK {
    constructor(ip, port, timeout , inport){
        this.connectionType = "tcp"

        this.zklibTcp = new ZKDeviceClient(ip,port) 
        this.interval = null 
        this.timer = null
        this.isBusy = false
        this.ip = ip
    }

    async functionWrapper (tcpCallback, command ){
        switch(this.connectionType){
            case 'tcp':
                
                if(this.zklibTcp.socket){
                
                    try{
                       
                        const res =  await tcpCallback();
                        
                        return res
                    }catch(err){
                        return Promise.reject(new ZKError(
                            err,
                            `[TCP] ${command}`,
                            this.ip
                        ))
                    }
                       
                }else{
                    return Promise.reject(new ZKError(
                        new Error( `Socket isn't connected !`),
                        `[TCP]`,
                        this.ip
                    ))
                }
            default:
                return Promise.reject(new ZKError(
                    new Error( `Socket isn't connected !`),
                    '',
                    this.ip
                ))
        }
    }

    async createSocket(cbErr, cbClose){
        try{
            if(!this.zklibTcp.socket){
                try{
                    await this.zklibTcp.createSocket(cbErr,cbClose)

                }catch(err){
                    throw err;
                }
              
                try{
                    await this.zklibTcp.connectWithCmd();
                }catch(err){
                    throw err;
                }
            }      

            this.connectionType = 'tcp'

        }catch(err){
            try{
                await this.zklibTcp.disconnect()
            }catch(err){}

            if(err.code !== ERROR_TYPES.ECONNREFUSED){
                return Promise.reject(new ZKError(err, 'TCP CONNECT' , this.ip))
            }

        }
    }


    async disconnect(){
        return await this.functionWrapper(
            ()=> this.zklibTcp.disconnect()
        )
    }



    async getInfo(){
        return await this.functionWrapper(
            ()=> this.zklibTcp.getInfo()
        )
    }

  async enableDevice(){
        return await this.functionWrapper(
            ()=> this.zklibTcp.enableDevice()
        )
    }

    async executeCmd(command, data=''){
        return await this.functionWrapper(
            ()=> this.zklibTcp.executeCmd(command, data)
        )
    }

   async getRealTimeLogs(cb){
    console.log("<======Get realtime data from here ======>")
        return await this.functionWrapper(
            ()=> this.zklibTcp.getRealTimeLogs(cb)
        )
    }


}


export default ZKSDK
