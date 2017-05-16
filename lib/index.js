const express = require('express'),
      logger = require('logops'),
      body_parser = require('body-parser'),
      https = require('https'),
      http = require('http'),
      config = require('config'),
      fs = require('fs'),
      app = express(),
      router_api = express.Router();

const api_ctrl = require('./api');

logger.info('INDEX: Starting server...');

const HTTP_PORT  = config.has('port') ? config.get('port') : 3080,
      HTTPS_PORT = config.has('https.port') ? config.get('https.port') : 3443,
      CA_DIR     = config.get('https.ca'),
      CERT_DIR   = config.get('https.cert'),
      KEY_DIR    = config.get('https.key'),
      STATIC_DIR = __dirname + '/../static';

logger.debug('Generating HTTPS config options');
var https_options = {
  cert: fs.readFileSync(CERT_DIR),
  key: fs.readFileSync(KEY_DIR)
};
if (CA_DIR instanceof String) {
  https_options.ca = [
    fs.readFileSync(CA_DIR)
  ];
} else {
  https_options.ca = [];
  for (var idx = 0; idx < CA_DIR.length; ++idx) {
    https_options.ca.push(fs.readFileSync(CA_DIR[idx]));
  }
}

app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());

logger.debug('Adding static files: ' + STATIC_DIR);
app.use('/', express.static(STATIC_DIR));

logger.debug('Adding routes to router_api');
router_api.route('/')
  .get(api_ctrl.getNames)
router_api.route('/:name')
  .get(api_ctrl.getDev)
  .post(api_ctrl.addSched);
router_api.route('/:name/:idx')
  .delete(api_ctrl.delSched);
app.use('/api', router_api);

https.createServer(https_options, app).listen(HTTPS_PORT, () => {
  logger.info('INDEX: HTTPS server started at localhost:' + HTTPS_PORT);
});

http.createServer((req, res) => {
  logger.info('INDEX: GET on ' + req.url + ' over HTTP. Redirecting to HTTPS')
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(HTTP_PORT, () => {
  logger.info('INDEX: HTTP server started at localhost:' + HTTP_PORT);
});
