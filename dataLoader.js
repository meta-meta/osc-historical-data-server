const _ = require('lodash');
const moment = require('moment');

const startDate = moment('2016-7-1', 'YYYY-MM-DD');
const endDate = moment();
const intervalMillis = 1000;
const programDuration = moment.duration(3, 'hours');
const tickCount = programDuration.asMilliseconds() / intervalMillis;
const scaledDuration = moment.duration(endDate.diff(startDate));
const scaledInterval = moment.duration(scaledDuration.asMilliseconds() / tickCount, 'milliseconds');

const scaledTime = startDate.clone();

let dailyDatasource1 = _.range(1000)
  .reverse()
  .map(n => ([moment().subtract(n, 'days'), _.random(0, 1, true)]));

let weeklyDatasource1 = _.range(100)
  .reverse()
  .map(n => ([moment().subtract(n, 'weeks'), _.random(10, 100, true)]));

const dataSources = [
  {
    address: '/daily1',
    dateFormat: '',
    dataSource: dailyDatasource1,
    currIndex: 0,
    type: 'f',
  },
  {
    address: '/weekly1',
    dateFormat: '',
    dataSource: weeklyDatasource1,
    currIndex: 0,
    type: 'f',
  },
];

{
  time, data: []
}

const ticks = _.range(tickCount)
  .map(tick => {
    const time = startDate.add(scaledInterval.asSeconds() * tick, 'seconds');
    const nextTime = startDate.add(scaledInterval.asSeconds() * (tick + 1), 'seconds');

    return ([
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
          value: time.format(formatter),
        }]
      })),

      {
        address: '/sealevel',
        args: [{ type: 'f', value: 1.4 }]
      },

      ...dataSources.map(({ address, dateFormat, dataSource, currIndex, type }) => {
        _.findIndex(dataSource, ([timestamp, value]) => {
          const sampleTime = moment(timestamp, dateFormat);
          return time.isBefore(sampleTime) && nextTime.isAfter(sampleTime);
        });

        return {
          address,
          args: [{ type, value: 1.4 }]
        }
      }),

    ]);
  });

const ticks = _.range(tickCount)



// console.log(_.first(weeklyDatasource1));
// console.log(_.last(dailyDatasource1));
// console.log(_.take(ticks, 10).map(JSON.stringify));


process.exit()