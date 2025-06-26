import ZKSDK from './lib/zksdk.js';
import { findLogByRecordTime } from './utils/index.js';

async function main() {
  const zkClient = new ZKSDK({ ip: '192.168.1.4' });

  try {
    await zkClient.createSocket(async (status) => {
      console.log('status at 8', status);

      if (status) {
        await zkClient.enableDevice();

        await zkClient.getRealTimeLogs(async (data) => {
          console.log('real time data', data);
        });

        // const logs = await zkClient.getAttendances(function () {
        //   if (err) throw err;
        //   console.log('Very cool!');
        // });
        // console.log(logs);
      }
    });

    // setTimeout(async () => {
    //   // console.log(await zkClient.getInfo())
    //   await zkClient.enableDevice();
    //   await zkClient.getRealTimeLogs((data) => {
    //     // await zkClient.deleteUser('1');
    //     console.log('real time data', data);
    //   });
    // }, 50000);

    // You can now use zkClient.writeMessage(...) to send commands
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    // zkClient.close();
  }
}

main();
// local log - Wed Jun 18 2025 13:10:02 GMT+0600 (Bangladesh Standard Time)
// real time log - Wed Jun 18, 2025, 13:16:56 GMT+0600 (Bangladesh Standard Time)
