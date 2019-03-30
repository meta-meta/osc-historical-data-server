const _ = require('lodash');
const csv = require('csvtojson');
const fs = require('fs');
const moment = require('moment');
const { performance } = require('perf_hooks');

const startDate = moment('1880-1-1', 'YYYY-MM-DD');
const endDate = moment();
const intervalMillis = 100;
const programDuration = moment.duration(30, 'minutes');
const tickCount = programDuration.asMilliseconds() / intervalMillis;
const scaledDuration = moment.duration(endDate.diff(startDate));
const scaledInterval = moment.duration(scaledDuration.asMilliseconds() / tickCount, 'milliseconds');

let dailyDatasource1 = _.range(1000)
  .reverse()
  .map(n => ([moment().subtract(n, 'days'), _.random(0, 1, true)]));

let weeklyDatasource1 = _.range(1000)
  .reverse()
  .map(n => ([moment().subtract(n, 'weeks'), _.random(10, 100, true)]));


const parseCsvFile = filepath =>
  csv({
    noheader: true,
    output: "csv",
  })
    .fromFile(filepath);


const valToArgsDefault = val => [{ type: 'f', value: val[1] }];

const processData = async () => {
  const dataSources = [
    // {
    //   address: '/daily1',
    //   dateFormat: '',
    //   dataSource: dailyDatasource1,
    //   startIndex: 0,
    //   type: 'f',
    //   valToArgs: valToArgsDefault,
    // },
    // {
    //   address: '/weekly1',
    //   dateFormat: '',
    //   dataSource: weeklyDatasource1,
    //   startIndex: 0,
    //   valToArgs: valToArgsDefault,
    // },
    {
      address: '/co2',
      dateFormat: 'DD-MMM-YYYY hh:mm:ss',
      dataSource: await parseCsvFile('data/co2.csv'),
      startIndex: 0,
      valToArgs: valToArgsDefault,
    },
    {
      address: '/temps', // temp anomaly
      dateFormat: 'YYYY',
      dataSource: await parseCsvFile('data/temps.csv'),
      startIndex: 0,
      valToArgs: valToArgsDefault,
    },
    {
      address: '/storms',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      dataSource: await parseCsvFile('data/Allstorms.ibtracs_all.v03r10.csv'),
      startIndex: 0,
      valToArgs: ([timestamp, name, lat, lon, wind, pressure]) => [ // TODO: -999 => null?
        { type: 's', value: name },
        { type: 'f', value: lat },
        { type: 'f', value: lon },
        { type: 'f', value: wind },
        { type: 'f', value: pressure },
      ],
    },
  ];

  const ticks = _.range(tickCount)
    .map(tick => {

      if (tick % 100 === 0) {
        console.log(`generating data - ${Math.trunc(100 * tick / tickCount)}% complete...`);
      }

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
              valToArgs,
            } = dataSourceConfig;

            const getTimeFromDatum = ([timestamp]) => moment(timestamp, dateFormat);

            const firstSampleTime = getTimeFromDatum(_.first(dataSource));
            const lastSampleTime = getTimeFromDatum(_.last(dataSource));

            if (firstSampleTime.isAfter(nextTime) || lastSampleTime.isBefore(time)) {
              return false;
            } else {

              let index = -1;
              for (let i = startIndex; i < dataSource.length; ++i) {
                const datum = dataSource[i];
                const sampleTime = getTimeFromDatum(datum);

                // dataSource is ordered. If nextTime is before sampleTime, it will be before all remaining samples
                if (nextTime.isBefore(sampleTime)) {
                  break;
                }

                if (time.isSameOrBefore(sampleTime) && nextTime.isAfter(sampleTime)) {
                  index = i;
                  break;
                }
              }

              /*// this is inefficient because it can't exit early
              const index = _.findIndex(
                dataSource,
                (datum) => {
                  const sampleTime = getTimeFromDatum(datum);
                  return time.isSameOrBefore(sampleTime) && nextTime.isAfter(sampleTime);
                },
                startIndex,
              );*/

              if (index === -1) {
                return false;
              } else {
                dataSources[dataSourceKey].startIndex = index + 1;
                return {
                  address,
                  args: valToArgs(dataSource[index])
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
};


processData();