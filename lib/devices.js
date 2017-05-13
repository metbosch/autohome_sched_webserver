const logger = require('logops'),
      fs = require('fs'),
      exec = require('child_process').exec;

const DEVS_PATH = __dirname + '/../devices/'

function set(name, stat) {
  logger.info('DEVICES set status for device: ' + name + ' to ' + stat);
  exec(DEVS_PATH + name + ' ' + stat, {shell: '/bin/bash'}, (err, stdout, stderr) => {
    if (err) {
      logger.error('DEVICES error setting device ' + name + ': ' + stderr );
    } else  {
      logger.info('DEVICE set status completed');
    }
  });
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
    ON: 1,
    OFF: 0
  }
};
