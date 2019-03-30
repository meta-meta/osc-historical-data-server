const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

const startDate = moment('2016-7-1', 'YYYY-MM-DD');
const endDate = moment();
const intervalMillis = 100;
const programDuration = moment.duration(3, 'minutes');
const tickCount = programDuration.asMilliseconds() / intervalMillis;
const scaledDuration = moment.duration(endDate.diff(startDate));
const scaledInterval = moment.duration(scaledDuration.asMilliseconds() / tickCount, 'milliseconds');

let dailyDatasource1 = _.range(1000)
  .reverse()
  .map(n => ([moment().subtract(n, 'days'), _.random(0, 1, true)]));

let weeklyDatasource1 = _.range(1000)
  .reverse()
  .map(n => ([moment().subtract(n, 'weeks'), _.random(10, 100, true)]));

const dataSources = [
  {
    address: '/daily1',
    dateFormat: '',
    dataSource: dailyDatasource1,
    startIndex: 0,
    type: 'f',
  },
  {
    address: '/weekly1',
    dateFormat: '',
    dataSource: weeklyDatasource1,
    startIndex: 0,
    type: 'f',
  },
];


const ticks = _.range(tickCount)
  .map(tick => {
    const time = startDate.clone().add(scaledInterval.asSeconds() * tick, 'seconds');
    const nextTime = startDate.clone().add(scaledInterval.asSeconds() * (tick + 1), 'seconds');

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

      ..._.compact(
        dataSources.map((dataSourceConfig, dataSourceKey) => {
          const {
            address,
            dateFormat,
            dataSource,
            startIndex,
            type,
          } = dataSourceConfig;

          const getTimeFromDatum = ([timestamp]) => moment(timestamp, dateFormat);

          const firstSampleTime = getTimeFromDatum(_.first(dataSource));
          const lastSampleTime = getTimeFromDatum(_.last(dataSource));

          if (firstSampleTime.isAfter(nextTime) || lastSampleTime.isBefore(time)) {
            return false;
          } else {

            const index = _.findIndex(
              dataSource,
              (datum) => {
                const sampleTime = getTimeFromDatum(datum);
                return time.isBefore(sampleTime) && nextTime.isAfter(sampleTime);
              },
              startIndex,
            );

            if (index === -1) {
              return false;
            } else {
              dataSources[dataSourceKey].currIndex = index;
              return {
                address,
                args: [{ type, value: dataSource[index][1] }]
              }
            }
          }
        })
      ),

    ]);
  });


console.log('writing file...');
fs.writeFileSync('./broadcastData.json', JSON.stringify({
  intervalMillis,
  ticks,
}));

process.exit()