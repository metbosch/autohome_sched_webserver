const storage = require('node-persist'),
      cron = require('node-cron'),
      logger = require('logops');

const devs = require('./devices')

var data = {};
var tasks = {};

function period_start(name, idx) {
  const a = tasks[name][idx].active;
  logger.info('PERIOD_START for name: ' + name + ', idx: ' + idx + ', active: ' + a);
  if (a) {
    devs.set(name, devs.STATS.ON);
    const milis = data[name][idx].period_on*60*1000; // Minutes to milis
    tasks[name][idx].timeout = setTimeout(period_stop, milis, name, idx);
  }
}

function period_stop(name, idx) {
  const a = tasks[name][idx].active;
  logger.info('PERIOD_STOP for name: ' + name + ', idx: ' + idx + ', active: ' + a);
  if (a) {
    devs.set(name, devs.STATS.OFF);
    const milis = data[name][idx].period_off*60*1000; // Minutes to milis
    tasks[name][idx].timeout = setTimeout(period_start, milis, name, idx);
  }
}

function start_sched() {
  const name = this.name;
  const idx = this.idx;
  tasks[name][idx].active = true;
  logger.info('SCHED_START for name: ' + name + ', idx: ' + idx);
  devs.set(name, devs.STATS.ON);

  // If schedule task sub periods, start them
  if (data[name][idx].period_on > 0) {
    const milis = data[name][idx].period_on*60*1000; // Minutes to milis
    logger.debug('SCHED_START (' + name + ', ' + idx + ') has periods. Addling a timeout of ' + milis + 'ms');
    tasks[name][idx].timeout = setTimeout(period_stop, milis, name, idx);
  }

  // If needed, do the end increment
  // Cannot do the ini increment here because it may create a double call for this function
  if (data[name][idx].inc_end != 0) {
    logger.debug('SCHED_START (' + name + ', ' + idx + ') has an end incerement (' + data[name][idx].inc_end + '). Current time_end: %j', data[name][idx].time_end);
    data[name][idx].time_end.m += data[name][idx].inc_end;
    if (data[name][idx].time_end.m < 0) {
      data[name][idx].time_end.m += 60;
      data[name][idx].time_end.h -= 1;
      if (data[name][idx].time_end.h < 0) {
        data[name][idx].time_end.h += 24;
      }
    } else if (data[name][idx].time_end.m > 59) {
      data[name][idx].time_end.m -= 60;
      data[name][idx].time_end.h += 1; 
      if (data[name][idx].time_end.h > 23) {
        data[name][idx].time_end.h -= 24;
      }
    }
    logger.debug('SCHED_START (' + name + ', ' + idx + ') new time_end: %j', data[name][idx].time_end);
    save_data(name);
    // Reschedule the end
    const code_end = '0 ' + data[name][idx].time_end.m + ' ' + data[name][idx].time_end.h + ' * * *';
    tasks[name][idx].end.destroy();
    tasks[name][idx].end = cron.schedule(code_end, stop_sched.bind({name: name, idx: idx}));
  }
  
}

function stop_sched() {
  const name = this.name;
  const idx = this.idx;
  tasks[name][idx].active = false;
  logger.info('SCHED_STOP for name: ' + name + ', idx: ' + idx);
  devs.set(name, devs.STATS.OFF);

  // If needed, do the ini increment
  // Cannot do the end increment here because it may create a double call for this function
  if (data[name][idx].inc_ini != 0) {
    logger.debug('SCHED_STOP (' + name + ', ' + idx + ') has an ini incerement(' + data[name][idx].inc_ini + '). Current time_ini: %j', data[name][idx].time_ini);
    data[name][idx].time_ini.m += data[name][idx].inc_ini;
    if (data[name][idx].time_ini.m < 0) {
      data[name][idx].time_ini.m += 60;
      data[name][idx].time_ini.h -= 1;
      if (data[name][idx].time_ini.h < 0) {
        data[name][idx].time_ini.h += 24;
      }
    } else if (data[name][idx].time_ini.m > 59) {
      data[name][idx].time_ini.m -= 60;
      data[name][idx].time_ini.h += 1; 
      if (data[name][idx].time_ini.h > 23) {
        data[name][idx].time_ini.h -= 24;
      }
    }
    logger.debug('SCHED_STOP (' + name + ', ' + idx + ') new time_ini: %j', data[name][idx].time_ini);
    save_data(name);
    // Reschedule the ini
    const code_ini = '0 ' + data[name][idx].time_ini.m + ' ' + data[name][idx].time_ini.h + ' * * *';
    tasks[name][idx].ini.destroy();
    tasks[name][idx].ini = cron.schedule(code_ini, start_sched.bind({name: name, idx: idx}));
  }
}


function load_data() {
  logger.info('LOAD_DATA starting importing the disk data');
  storage.forEach((key, value) => {
    logger.debug('LOAD_DATA loading data for device: ' + key + ' which has ' + value.length + ' schedules');
    // Restore the data
    data[key] = value;

    // Restore the schedules
    tasks[key] = [];
    for (var idx = 0; idx < value.length; ++idx) {
       var code_ini = '0 ' + data[key][idx].time_ini.m + ' ' + data[key][idx].time_ini.h + ' * * *';
       var code_end = '0 ' + data[key][idx].time_end.m + ' ' + data[key][idx].time_end.h + ' * * *';
       logger.debug('LOAD_DATA adding cron schedule (' + code_ini + ') for function "start_sched"');
       logger.debug('LOAD_DATA adding cron schedule (' + code_end + ') for function "stop_sched"');
       tasks[key][idx] = {
         ini: cron.schedule(code_ini, start_sched.bind({name: key, idx: idx})),
         end: cron.schedule(code_end, stop_sched.bind({name: key, idx: idx})),
         active: false
       };
    }
  });
  logger.info('LOAD_DATA done');
}

function save_data(name) {
  storage.setItemSync(name, data[name]);
}

function add(name, time_ini, time_end, period_on, period_off, inc_ini, inc_end) {
  if (!data[name]) {
    data[name] = [];
    tasks[name] = [];
  }
  logger.info('ADD device: ' + name + ', time_ini: %j, time_end: %j, period_on: ' + period_on + ', period_off: ' +
    period_off + ', inc_ini: ' + inc_ini + ', inc_end: ' + inc_end, time_ini, time_end);

  // Save the info
  period_on = period_on || 0;
  period_off = period_off || 0;
  inc_ini = inc_ini || 0;
  inc_end = inc_end || 0;
  data[name].push({
    time_ini: time_ini,
    time_end: time_end,
    period_on: period_on,
    period_off: period_off,
    inc_ini: inc_ini,
    inc_end: inc_end
  });
  save_data(name);

  // Create the schedule
  const idx = data[name].length - 1;
  const code_ini = '0 ' + data[name][idx].time_ini.m + ' ' + data[name][idx].time_ini.h + ' * * *';
  const code_end = '0 ' + data[name][idx].time_end.m + ' ' + data[name][idx].time_end.h + ' * * *';
  logger.debug('ADD adding cron schedule (' + code_ini + ') for function "start_sched"');
  logger.debug('ADD adding cron schedule (' + code_end + ') for function "stop_sched"');
  tasks[name][idx] = {
    ini: cron.schedule(code_ini, start_sched.bind({name: name, idx: idx})),
    end: cron.schedule(code_end, stop_sched.bind({name: name, idx: idx})),
    active: false
  };
}

function get(name) {
  return data[name] || [];
}

function remove(name, idx) {
  if (!data[name]) {
    data[name] = [];
    tasks[name] = [];
  }
  logger.info('REMOVE device: ' + name + ', idx:' + idx);
  
  if (idx < data[name].length) {
    if (tasks[name][idx].active) {
       tasks[name][idx].active = false;
       if (tasks[name][idx].timeout) {
          // Clear the timeout because the task struct no longer will exist
          clearTimeout(tasks[name][idx].timeout);
       }
       //Turn off the device
       devs.set(name, devs.STATS.OFF);
    }
    tasks[name][idx].ini.destroy();
    tasks[name][idx].end.destroy();
    tasks[name].splice(idx, 1);
    data[name].splice(idx, 1);
    save_data(name, data[name]);
  }
}

storage.initSync();
load_data();

module.exports = {
  add: add,
  get: get,
  remove: remove
};
