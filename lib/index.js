const express = require('express'),
      logger = require('logops'),
      body_parser = require('body-parser'),
      app = express(),
      router_api = express.Router();

const api_ctrl = require('./api');

const PORT = 3000;

logger.info('INDEX Starting server...');

app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());
app.use(express.static('static'));

router_api.route('/')
  .get(api_ctrl.getNames)
router_api.route('/:name')
  .get(api_ctrl.getDev)
  .post(api_ctrl.addSched);
router_api.route('/:name/:idx')
  .delete(api_ctrl.delSched);
app.use('/api', router_api);

app.listen(PORT, () => {
  logger.info('INDEX Server started at localhost:' + PORT);
});
