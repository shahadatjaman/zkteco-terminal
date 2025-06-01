// Test code:

import ZKTeco from "zkteco-sha";

const test = async () => {
  try {
    // Define the IP address of the device.
    const deviceIp = "192.168.1.4";

    //  Ips
    const ips = [deviceIp];
   
    // List of devices with their respective IP addresses and ports.
    const devices = [{ deviceIp, devicePort: "4370" }];
    let zkInstance = new ZKTeco(devices);

    // Connect all devices
    await zkInstance.connectAll();
    const users = await zkInstance.getUsers(deviceIp);

    // Retrieve all logs stored in the machine.
    // At the moment, there's no filter to select specific device logs, it captures everything!!
    const logs = await zkInstance.getAttendances(deviceIp);
    console.log(logs);


  } catch (e) {
    console.log(e);
    if (e.code === "EADDRINUSE") {
    }
  }
};

test(); // in the end we execute the function