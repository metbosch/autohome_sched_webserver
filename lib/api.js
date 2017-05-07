const sched = require('./persistent_sched.js'),
      logger = require('logops');

module.exports = {
  get: (req, res) => {
    const name = req.params.name;
    logger.info('GET /api/:name for device: ' + name);
    if (!name || name === '') {
      res.send([]);
    } else {
      var data = sched.get(name);
      res.send(data);
    }
  },
  add: (req, res) => {
    const name = req.params.name;
    logger.info('POST /api/:name for device: ' + name);
    if (!name || name === '') {
      res.sendStatus(404);
    } else {
      sched.add(
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
      res.sendStatus(200);
    }
  },
  remove: (req, res) => {
    const name = req.params.name;
    const idx = req.params.idx;
    logger.info('DELETE /api/:name/:idx for device: ' + name + ', idx: ' + idx);
    if (!name || name === '') {
      res.sendStatus(404);
    } else {
      sched.remove(name, idx);
      res.sendStatus(200);
    }
  }
};

