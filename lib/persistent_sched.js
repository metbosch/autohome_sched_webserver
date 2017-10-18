const storage = require('node-persist'),
      cron = require('node-cron'),
      logger = require('logops');

const devs = require('./devices')

var data = {};
var tasks = {};

function period_start(name, id) {
  const a = tasks[name][id].active;
  logger.info('PERIOD_START for name: ' + name + ', id: ' + id + ', active: ' + a);
  if (a) {
    devs.set(name, devs.STATS.ON);
    const milis = data[name][id].period_on*60*1000; // Minutes to milis
    tasks[name][id].timeout = setTimeout(period_stop, milis, name, id);
  }
}

function period_stop(name, id) {
  const a = tasks[name][id].active;
  logger.info('PERIOD_STOP for name: ' + name + ', id: ' + id + ', active: ' + a);
  if (a) {
    devs.set(name, devs.STATS.OFF);
    const milis = data[name][id].period_off*60*1000; // Minutes to milis
    tasks[name][id].timeout = setTimeout(period_start, milis, name, id);
  }
}

function start_sched() {
  const name = this.name;
  const id = this.id;
  logger.info('SCHED_START for name: ' + name + ', id: ' + id);
  tasks[name][id].active = true;
  devs.set(name, devs.STATS.ON);

  // If schedule task sub periods, start them
  if (data[name][id].period_on > 0) {
    const milis = data[name][id].period_on*60*1000; // Minutes to milis
    logger.debug('SCHED_START (' + name + ', ' + id + ') has periods. Addling a timeout of ' + milis + 'ms');
    tasks[name][id].timeout = setTimeout(period_stop, milis, name, id);
  }

  // If needed, do the end increment
  // Cannot do the ini increment here because it may create a double call for this function
  if (data[name][id].inc_end != 0) {
    logger.debug('SCHED_START (' + name + ', ' + id + ') has an end incerement (' + data[name][id].inc_end + '). Current time_end: %j', data[name][id].time_end);
    data[name][id].time_end.m += data[name][id].inc_end;
    if (data[name][id].time_end.m < 0) {
      data[name][id].time_end.m += 60;
      data[name][id].time_end.h -= 1;
      if (data[name][id].time_end.h < 0) {
        data[name][id].time_end.h += 24;
      }
    } else if (data[name][id].time_end.m > 59) {
      data[name][id].time_end.m -= 60;
      data[name][id].time_end.h += 1;
      if (data[name][id].time_end.h > 23) {
        data[name][id].time_end.h -= 24;
      }
    }
    logger.debug('SCHED_START (' + name + ', ' + id + ') new time_end: %j', data[name][id].time_end);
    save_data(name);
    // Reschedule the end
    const code_end = '0 ' + data[name][id].time_end.m + ' ' + data[name][id].time_end.h + ' * * *';
    tasks[name][id].end.destroy();
    tasks[name][id].end = cron.schedule(code_end, stop_sched.bind({name: name, id: id}));
  }

}

function stop_sched() {
  const name = this.name;
  const id = this.id;
  logger.info('SCHED_STOP for name: ' + name + ', id: ' + id);
  tasks[name][id].active = false;
  devs.set(name, devs.STATS.OFF);

  // If needed, do the ini increment
  // Cannot do the end increment here because it may create a double call for this function
  if (data[name][id].inc_ini != 0) {
    logger.debug('SCHED_STOP (' + name + ', ' + id + ') has an ini incerement(' + data[name][id].inc_ini + '). Current time_ini: %j', data[name][id].time_ini);
    data[name][id].time_ini.m += data[name][id].inc_ini;
    if (data[name][id].time_ini.m < 0) {
      data[name][id].time_ini.m += 60;
      data[name][id].time_ini.h -= 1;
      if (data[name][id].time_ini.h < 0) {
        data[name][id].time_ini.h += 24;
      }
    } else if (data[name][id].time_ini.m > 59) {
      data[name][id].time_ini.m -= 60;
      data[name][id].time_ini.h += 1;
      if (data[name][id].time_ini.h > 23) {
        data[name][id].time_ini.h -= 24;
      }
    }
    logger.debug('SCHED_STOP (' + name + ', ' + id + ') new time_ini: %j', data[name][id].time_ini);
    save_data(name);
    // Reschedule the ini
    const code_ini = '0 ' + data[name][id].time_ini.m + ' ' + data[name][id].time_ini.h + ' * * *';
    tasks[name][id].ini.destroy();
    tasks[name][id].ini = cron.schedule(code_ini, start_sched.bind({name: name, id: id}));
  }
}


function load_data() {
  logger.info('LOAD_DATA starting importing the disk data');
  storage.forEach((key, values) => {
    logger.debug('LOAD_DATA loading data for device: ' + key + ' which has ' + values.length + ' schedules');
    for (var id in values) {
      var value = values[id];
      add(key, value.time_ini, value.time_end, value.period_on, value.period_off, value.inc_ini, value.inc_end);
    }
  });
  logger.info('LOAD_DATA done');
}

function save_data(name) {
  storage.setItemSync(name, data[name]);
}

function add(name, time_ini, time_end, period_on, period_off, inc_ini, inc_end) {
  if (!data[name]) {
    data[name] = {};
    tasks[name] = {};
  }
  logger.info('ADD device: ' + name + ', time_ini: %j, time_end: %j, period_on: ' + period_on + ', period_off: ' +
    period_off + ', inc_ini: ' + inc_ini + ', inc_end: ' + inc_end, time_ini, time_end);
  if (time_ini == null || time_end == null) {
    logger.error('ADD device: failed for ' + name + ' because time_ini or time_end are undefined');
    return false;
  } else if (time_ini.m == null || time_ini.h == null || time_end.m == null || time_end.h == null) {
    logger.error('ADD device: failed for ' + name + ' because time_ini or time_end have undefined "m" or "h" fields');
    return false;
  } else if (time_ini.h < 0 || time_ini.h > 23 || time_ini.m < 0 || time_ini.m > 59) {
    logger.error('ADD device: failed for ' + name + ' because time_ini has invalid "m" or "h" fields');
    return false;
  } else if (time_end.h < 0 || time_end.h > 23 || time_end.m < 0 || time_end.m > 59) {
    logger.error('ADD device: failed for ' + name + ' because time_end has invalid "m" or "h" fields');
    return false;
  }

  // Generate a unique id for the schedule
  var id = Date.now();
  while (data[name][id]) {
    id += 1;
  }
  id = id.toString();
  logger.info('ADD device: ' + name + ', id: ' + id);

  // Save the info
  period_on = period_on || 0;
  period_off = period_off || 0;
  inc_ini = inc_ini || 0;
  inc_end = inc_end || 0;
  data[name][id] = {
    time_ini: time_ini,
    time_end: time_end,
    period_on: period_on,
    period_off: period_off,
    inc_ini: inc_ini,
    inc_end: inc_end
  };
  save_data(name);

  // Create the schedule
  const code_ini = '0 ' + data[name][id].time_ini.m + ' ' + data[name][id].time_ini.h + ' * * *';
  const code_end = '0 ' + data[name][id].time_end.m + ' ' + data[name][id].time_end.h + ' * * *';
  logger.debug('ADD adding cron schedule (' + code_ini + ') for function "start_sched"');
  logger.debug('ADD adding cron schedule (' + code_end + ') for function "stop_sched"');
  tasks[name][id] = {
    ini: cron.schedule(code_ini, start_sched.bind({name: name, id: id})),
    end: cron.schedule(code_end, stop_sched.bind({name: name, id: id})),
    active: false
  };

  // Check if device should be ON now
  var date = new Date();
  var time_now = {
    h: date.getHours(),
    m: date.getMinutes()
  };
  if (time_in_range(time_now, time_ini, time_end)) {
     start_sched.bind({name: name, id: id})();
  } else {
  }
  return true;
}

function get(name) {
  return data[name] || [];
}

function remove(name, id) {
  if (!data[name]) {
    data[name] = {};
    tasks[name] = {};
  }
  logger.info('REMOVE device: ' + name + ', id:' + id);

  if (data[name][id]) {
    if (tasks[name][id].active) {
       tasks[name][id].active = false;
       if (tasks[name][id].timeout) {
          // Clear the timeout because the task struct no longer will exist
          clearTimeout(tasks[name][id].timeout);
       }
       //Turn off the device
       devs.set(name, devs.STATS.OFF);
    }
    tasks[name][id].ini.destroy();
    tasks[name][id].end.destroy();
    delete tasks[name][id];
    delete data[name][id];
    save_data(name);
  }
}

function time_in_range(now, ini, end) {
  if (ini.h > end.h) {
    if (now.h <= end.h) now.h += 24;
    end.h += 24;
  }
  if (now.h >= ini.h && now.h <= end.h) {
    return (now.h === ini.h && now.m >= ini.m) || (now.h === end.h && now.m < end.m) || (now.h !== ini.h && now.h !== end.h);
  }
  return false;
}

storage.initSync();
load_data();

module.exports = {
  add: add,
  get: get,
  remove: remove
};
