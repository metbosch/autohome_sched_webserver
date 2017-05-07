const logger = require('logops');

function set(name, stat) {
  logger.info('DEVICES set status for device: ' + name + ' to ' + stat);
}

module.exports = {
  set: set,
  STATS: {
    ON: 0,
    OFF: 1
  }
};
