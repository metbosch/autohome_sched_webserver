const logger = require('logops');

const sched = require('./persistent_sched.js'),
      devs = require('./devices');

module.exports = {
  getNames: (req, res) => {
    logger.info('GET /api');
    var data = devs.get();
    res.send(data);
  },
  getDev: (req, res) => {
    const name = req.params.name;
    logger.info('GET /api/:name for device: ' + name);
    if (!name || name === '') {
      res.send([]);
    } else {
      var data_in = sched.get(name);
      var data_out = [];
      for (var id in data_in) {
        data_out.push({
          id: id,
          time_ini_h: data_in[id].time_ini.h,
          time_ini_m: data_in[id].time_ini.m,
          time_end_h: data_in[id].time_end.h,
          time_end_m: data_in[id].time_end.m,
          period_on: data_in[id].period_on,
          period_off: data_in[id].period_off,
          inc_ini: data_in[id].inc_ini,
          inc_end: data_in[id].inc_end
        });
      }
      res.send(data_out);
    }
  },
  addSched: (req, res) => {
    const name = req.params.name;
    logger.info('POST /api/:name for device: ' + name);
    if (!name || name === '') {
      res.sendStatus(404);
    } else {
      var result = sched.add(
        name,
        {
          h: req.body.time_ini_h,
          m: req.body.time_ini_m
        },
        {
          h: req.body.time_end_h,
          m: req.body.time_end_m
        },
        req.body.period_on,
        req.body.period_off,
        req.body.inc_ini,
        req.body.inc_end
      );
      res.sendStatus(result ? 200 : 400);
    }
  },
  delSched: (req, res) => {
    const name = req.params.name;
    const id = req.params.id;
    logger.info('DELETE /api/:name/:id for device: ' + name + ', id: ' + id);
    if (!name || name === '') {
      res.sendStatus(404);
    } else {
      sched.remove(name, id);
      res.sendStatus(200);
    }
  }
};
