const logger = require('logops'),
      fs = require('fs');

const DEVS_PATH = __dirname + '/../devices/'

function set(name, stat) {
  logger.info('DEVICES set status for device: ' + name + ' to ' + stat);
}

function get() {
  var devs = [];
  fs.readdirSync(DEVS_PATH).forEach((dev) => {
    devs.push({
      name: dev,
      fullname: dev
    });
  });
  return devs;
}

module.exports = {
  set: set,
  get: get,
  STATS: {
    ON: 0,
    OFF: 1
  }
};
