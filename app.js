const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  pingTimeout: 60000,
});

// * parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '100mb',
  }),
);

// * parse request.body
app.use(bodyParser.json({ limit: '100mb' }));

// * serve static files
app.use('/', express.static(path.join(__dirname, './public')));
app.use(
  '/node_modules',
  express.static(path.join(__dirname, './node_modules')),
);

// * template engine setup
require('ejs');
app.set('views', path.join(__dirname, './views/layouts'));
app.set('view engine', 'ejs');

module.exports = { app, http, io };
