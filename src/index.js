import ZKSDK from './lib/zksdk.js';

async function main() {
  const zkClient = new ZKSDK({ ip: '192.168.1.2' });

  try {
    await zkClient.createSocket();

    // await zkClient.authenticate();
    console.log("🎉 Device is ready for commands!");

    console.log("############# Device INFO #########")
    console.log(await zkClient.getInfo())
     zkClient.getRealTimeLogs((data)=> {
      console.log('real time data',data);
    })
    // You can now use zkClient.writeMessage(...) to send commands

  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    // zkClient.close();
  }
}

main();
