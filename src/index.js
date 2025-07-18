import ZKSDK from './lib/zksdk.js';
import { findLogByRecordTime } from './utils/index.js';

async function main() {
  const zkClient = new ZKSDK({ ip: '103.135.252.69' });

  try {
    await zkClient.createSocket(async (status) => {
      console.log('status at 8', status);

      if (status) {
        await zkClient.enableDevice();

        const time = await zkClient.shutdown();
        console.log('time', time);

        // const newTime = new Date('2025-06-29T09:12:06.000Z');
        // await zkClient.setTime(newTime);
      }
    });
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    // zkClient.close();
  }
}

main();
