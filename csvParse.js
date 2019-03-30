const _ = require("lodash");
const moment = require("moment");
const csv = require("csvtojson");

const tempsFilePath = "data/temps.csv";
const co2FilePath = "data/co2.csv";

const parseCsvFile = filepath =>
  csv({
    noheader: true,
    output: "csv",
  })
    .fromFile(filepath)
    .then(result => {
      return result.map(([time, val]) => [moment(time), val]);
    });

//

const startDate = moment("1800-1-1", "YYYY-MM-DD");
const endDate = moment();
const intervalMillis = 30000;
const programDuration = moment.duration(3, "hours");
const tickCount = programDuration.asMilliseconds() / intervalMillis;
const scaledDuration = moment.duration(endDate.diff(startDate));
const scaledInterval = moment.duration(
  scaledDuration.asMilliseconds() / tickCount,
  "milliseconds"
);

const scaledTime = startDate.clone();

let dailyDatasource1 = _.range(1000)
  .reverse()
  .map(n => [moment().subtract(n, "days"), _.random(0, 1, true)]);

let weeklyDatasource1 = _.range(100)
  .reverse()
  .map(n => [moment().subtract(n, "weeks"), _.random(10, 100, true)]);

const dataSources = [
  {
    address: "/daily1",
    dateFormat: "",
    dataSource: dailyDatasource1,
    currIndex: 0,
    type: "f",
  },
  {
    address: "/weekly1",
    dateFormat: "",
    dataSource: weeklyDatasource1,
    currIndex: 0,
    type: "f",
  },
];

const ticks = _.range(tickCount).map(tick => {
  const time = startDate
    .clone()
    .add(scaledInterval.asSeconds() * tick, "seconds");
  const nextTime = startDate
    .clone()
    .add(scaledInterval.asSeconds() * (tick + 1), "seconds");

  return {
    time,
    nextTime,
    data: {},
  };
});

// console.log("ticks:", ticks);

// prettier-ignore
addCsv = (ticks, co2, dataKey) => {
    let co2Index = 0;

    return ticks.map(({time, nextTime, data}, i) => {

        const [co2Date, co2Val] = co2[co2Index] || [];
        // console.log('co2Val:', co2Val)

        // if (co2Date && (co2Date >= time && co2Date < nextTime)) {
        if (co2Date && (co2Date.isSameOrAfter(time) && co2Date.isBefore(nextTime))) {
            co2Index++;
            // console.log('co2Index:', co2Index)

            return ({
                time,
                nextTime,
                data: {
                    ...data,
                    [dataKey]: co2Val,
                }
            })

        } else {
            return ({
                time,
                nextTime,
                data,
            })
        }
    });
}

//

parseCsvFile(tempsFilePath).then(arr => {
  const newTicks = addCsv(ticks, arr, "temps");

  console.log("newTicks:", newTicks);

  //   parseCsvFile(co2FilePath).then(arr2 => {
  //     console.log("arr2:", arr2);

  //     const co2Ticks = addCsv(newTicks, arr2, 'co2');
  //     console.log("co2Ticks:", co2Ticks);
  //   });
});
