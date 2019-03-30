const fs = require('fs');
const osc = require('osc');
const moment = require('moment');
const netmask = require('netmask');


const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 8001,
  metadata: true
});


// console.log(new netmask.Netmask('10.0.0.0/12'))
// console.log(new netmask.Netmask('192.168.1.0/24'))
const broadcastIp = new netmask.Netmask('192.168.1.0/24').broadcast;
const broadcast = (obj) => udpPort.send(obj, broadcastIp, 8000);

console.log('loading file...');

const {
  intervalMillis,
  ticks,
} = JSON.parse(fs.readFileSync('./broadcastData.json'));

console.log('file loaded. broadcasting every', intervalMillis, 'millis');

udpPort.open();

udpPort.on(
  'ready',
  () => {

    let i = 0;

    // broadcast('/num', [{ type: 'h', value: 1000000000000 }])  // Max receives this as 0

    // OSC types
    // https://github.com/colinbdclark/osc.js/blob/e774260dae505de3963f2ced16e2731a6aca0652/src/osc.js#L943
    setInterval(() => {
        const tick = ticks[i];
        if (tick) {
          i++;
          broadcast({
            timeTag: osc.timeTag(0),
            packets: tick,
          })
        }
      },
      intervalMillis,
    );
  },
);

// process.exit()
