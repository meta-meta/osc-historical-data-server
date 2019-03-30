const osc = require('osc');
const moment = require('moment');
const netmask = require('netmask');


const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 8001,
  metadata: true
});

udpPort.open();

// console.log(new netmask.Netmask('10.0.0.0/12'))
// console.log(new netmask.Netmask('192.168.1.0/24'))
const broadcastIp = new netmask.Netmask('192.168.1.0/24').broadcast;
const broadcast = (obj) => udpPort.send(obj, broadcastIp, 8000);

const startDate = moment('1800-1-1', 'YYYY-MM-DD');

const intervalMillis = 100;
const programDuration = moment.duration(3, 'hours');
const tickCount = programDuration.asMilliseconds() / intervalMillis;
const scaledDuration = moment.duration(moment().diff(startDate));
const scaledInterval = moment.duration(scaledDuration.asMilliseconds() / tickCount, 'milliseconds');

const scaledTime = startDate.clone();

udpPort.on(
  'ready',
  () => {

    // broadcast('/num', [{ type: 'h', value: 1000000000000 }])  // Max receives this as 0

    // OSC types
    // https://github.com/colinbdclark/osc.js/blob/e774260dae505de3963f2ced16e2731a6aca0652/src/osc.js#L943
    setInterval(() => {

        scaledTime.add(scaledInterval);




        broadcast({
          timeTag: osc.timeTag(0),
          packets: [

            ...[ // Simulation Time
              ['/time/formatted', 'dddd, MMMM Do YYYY, h:mm:ss a'],
              ['/time/month', 'MMM'],
              ['/time/day', 'DD'],
              ['/time/year', 'YYYY'],
              ['/time/hourminute', 'HH:mm'],
            ].map(([address, formatter]) => ({
              address,
              args: [{
                type: 's',
                value: scaledTime.format(formatter),
              }]
            })),

            {
              address: '/num',
              args: [
                {
                  type: 'f',
                  value: 13424.64,
                }
              ]
            },
          ]

        })
      },
      intervalMillis,
    );
  },
);

// process.exit()
