import ZKSDK from './lib/zksdk.js';
import { findLogByRecordTime } from './utils/index.js';

async function main() {
  const zkClient = new ZKSDK({ ip: '192.168.1.6' });

  try {
    await zkClient.createSocket(async (status) => {
      console.log('status at 8', status);

      if (status) {
        await zkClient.enableDevice();

        await zkClient.getRealTimeLogs(async (data) => {
          console.log('real time data', data);
        });

        // await zkClient.setUser('YD7I', 'YD7I', 'SHAHADAT', '1234567');

        // await zkClient.deleteUser('4');
      }
    });
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    // zkClient.close();
  }
}

main();
