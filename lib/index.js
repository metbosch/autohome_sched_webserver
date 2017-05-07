const express = require('express'),
      logger = require('logops'),
      body_parser = require('body-parser'),
      app = express(),
      router_api = express.Router(),
      router = express.Router();

const api_ctrl = require('./api');

const PORT = 3000;

logger.info('INDEX Starting server...');

app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());

router.get('/', (req, res) => {
  logger.info('ROUTER GET on /');
  res.send('Hello from Server!')
});
app.use(router)

router_api.route('/:name')
  .get(api_ctrl.get)
  .post(api_ctrl.add);
router_api.route('/:name/:idx')
  .delete(api_ctrl.remove);
app.use('/api', router_api);

app.listen(PORT, () => {
  logger.info('INDEX Server started at localhost:' + PORT);
});
