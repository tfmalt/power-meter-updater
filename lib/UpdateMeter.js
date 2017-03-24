/**
 * Created by tm on 13/04/15.
 *
 * @author Thomas Malt <thomas@malt.no>
 * @copyright 2013-2015 (c) Thomas Malt
 */

const EventEmitter = require('events').EventEmitter;
const utils = require('./meterUtils');
// const TimeEmitter = require('./TimeEmitter');
const CronEmitter = require('cron-emitter');

/**
 * We create the updateMeter as an object literal inheriting directly from
 * an events.EventEmitter object.
 *   minutes: 1560,    // every minutes for 24 + 2 hours
 *   fiveMinutes: 2304 // 5 minute sum 7 + 1 day
 *
 * @type {EventEmitter.EventEmitter}
 */
class UpdateMeter extends EventEmitter {
  constructor(redis) {
    super();

    this.db     = redis;
    this.timer  = new CronEmitter();
    this.limits = {
      minutes: 1560,
      fiveMinutes: 2304
    };
  }

  /**
   * Starts the monitoring. Enters a loop of recursively triggered setTimeout.
   * setTimeout is chosen over setInterval to correct for time skew.
   *
   * @returns {UpdateMeter} reference to self.
   */
  start() {
    const timer = this.timer;

    timer.add('0    *    *    *    *    *', 'every_minute');
    timer.add('0  */5    *    *    *    *', 'every_five_minutes');
    timer.add('0 */30    *    *    *    *', 'every_half_hour');
    timer.add('0    0    *    *    *    *', 'every_hour');
    timer.add('0    0  */6    *    *    *', 'every_six_hours');
    timer.add('0    0    0    *    *    *', 'every_midnight');
    timer.add('0    0    0    *    *    0', 'every_week');
    timer.add('0    0    0    1    *    *', 'every_month');
    timer.add('0    0    0    1    1    *', 'every_year');

    timer.on('every_minute',       () => this.insertIntoList('minutes'));
    timer.on('every_five_minutes', () => this.insertIntoList('fiveMinutes'));
    timer.on('every_half_hour',    () => this.insertIntoList('halfHours'));
    timer.on('every_hour',         () => this.insertIntoList('hours'));
    timer.on('every_six_hours',    () => this.insertIntoList('sixHours'));
    timer.on('every_midnight',     () => this.insertIntoList('days'));
    timer.on('every_week',         () => this.insertIntoList('weeks'));
    timer.on('every_month',        () => this.insertIntoList('months'));
    timer.on('every_year',         () => this.insertIntoList('years'));

    /* istanbul ignore next */
    // setTimeout(() => timer.doEveryMinute(), timer.getTimeoutLength());

    return this;
  }


  /**
   * Helper function that returns the correct list to insert data into and which
   * list to fetch data from.
   *
   * @param {string} name which resource
   * @returns {object} information about which list to insert data in
   * @private
   */
  getListSource(name) {
    const listSource = {
      minutes:     {source: 'seconds', length: 6},
      fiveMinutes: {source: 'minutes', length: 5},
      halfHours:   {source: 'minutes', length: 30},
      hours:       {source: 'minutes', length: 60},
      sixHours:    {source: 'hours',   length: 6},
      days:        {source: 'hours',   length: 2},
      weeks:       {source: 'days',    length: 7},
      months:      {source: 'days',    length: utils.getMonthDays(new Date())},
      years:       {source: 'months',  length: 12}
    };

    if (!listSource.hasOwnProperty(name)) {
      throw new TypeError('Argument must be a valid list source');
    }

    return listSource[name];
  }

  /**
   * Inserts a data object specified for the specific list into the database.
   *
   * @param {string} list in redis database to fetch data from
   * @returns {Promise} the promise from getRangeFromDb
   * @private
   */
  insertIntoList(list) {
    const src = this.getListSource(list);

    return this.getRangeFromDb(src.source, src.length).then(data => {
      this.db.rpush(list, JSON.stringify(data));
      this.emit('stored_data', {list, data});
      return data;
    });
  }

  /**
   * Returns a promise with a range from the end of one of the redis lists
   *
   * @param {string} name name of key
   * @param {integer} number of items the fetch from end.
   * @returns {Promise} A promise with the result form the range query.
   * @private
   */
  getRangeFromDb(name, number) {
    return this.db.lrangeAsync(name, number * -1, -1)
      .then(values => values.map(JSON.parse))
      .then(values => {
        const data = this.getDataStub();

        data.pulses = values.reduce((a, b) => (a + b.pulses), 0);
        data.kwh    = values.reduce((a, b) => (a + b.kwh), 0);
        if (name === 'seconds') {
          data.watt = Math.round(parseFloat(data.kwh * 3600 * 1000 / 60));
        }
        data[utils.getSeriesName(name)] = values.map(i => i.pulses);

        return data;
      })
      .then(data => {
        data.kwh = parseFloat(data.kwh.toFixed(4));
        return data;
      })
      .catch(error => this.emit('error', {location: 'getRangeFromDb', error}));
  }

  /**
   * Helper that generates the start of every json data object stored in the db.
   *
   * @returns {object} Timestamp object.
   * @private
   */
  getDataStub() {
    const stamp = new Date();
    return {timestamp: stamp.getTime(), time: stamp.toJSON()};
  }
}

module.exports = UpdateMeter;
