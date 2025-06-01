import ZKSDK from './lib/zksdk.js';

async function main() {
  const zkClient = new ZKSDK({ ip: '192.168.1.5' });

  try {
    await zkClient.createSocket(async (status) => {
      console.log('status at 8', status);

      if (status) {
        await zkClient.enableDevice();
        await zkClient.getRealTimeLogs((data) => {
          // await zkClient.deleteUser('1');
          console.log('real time data', data);
        });
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
