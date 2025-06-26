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
      }
    });
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    // zkClient.close();
  }
}

main();
