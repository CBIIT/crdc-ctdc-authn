const newrelic = require('newrelic');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const {createSession} = require("./services/session");
var http_logger = require('morgan');
const fs = require('fs');
const cors = require('cors');
const config = require('./config');
const {getTTL, getPing, getVersion} = require("./services/mysql-connection");
const cookieParser = require('cookie-parser');
const logger = require('./logger');


const LOG_FOLDER = 'logs';
let accessLogStream = process.stdout;
try {
  fs.mkdirSync(LOG_FOLDER, { recursive: true });
  accessLogStream = fs.createWriteStream(path.join(__dirname, LOG_FOLDER, 'access.log'), { flags: 'a' });
} catch (err) {
  logger.warn(`Unable to create log directory "${LOG_FOLDER}", falling back to stdout: ${err.message}`);
}

var authRouter = require('./routes/auth');

var app = express();
app.use(cors());

// setup the logger
app.use(http_logger('combined', { stream: accessLogStream }))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/api/auth/session-ttl', (req, res) => {
  logger.debug(`http.request.start method=${req.method} path=${req.path}`);
  logger.info('Session TTL endpoint called');
  getTTL(req, res);
});

app.get('/api/auth/ping', function (req, res, next) {
  logger.debug(`http.request.start method=${req.method} path=${req.path}`);
  res.send(`pong`);
});

app.get('/api/auth/version', function (req, res, next) {
  logger.debug(`http.request.start method=${req.method} path=${req.path}`);
  logger.info(`Version requested: ${config.version}`);
  res.json({
      version: config.version, date: config.date
  });
});

app.use(createSession({ sessionSecret: config.cookie_secret, session_timeout: config.session_timeout }));

app.use('/api/auth', authRouter);

if (process.env.NODE_ENV === 'development') {
  logger.info("Running in development mode, local test page enabled");
  app.set('view engine', 'ejs');
  app.get('/', (req, res) => {
    logger.debug(`http.request.start method=${req.method} path=${req.path}`);
    res.render('index', {
      googleClientID: config.google.CLIENT_ID,
      nihClientID: config.nih.CLIENT_ID,
      nihRedirectURL: config.nih.REDIRECT_URL,
      noAutoLogin: config.noAutoLogin
    });
  });
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  logger.error(`[${req.method}] ${req.path} - Error ${statusCode}: ${err.message}`);
  if (req.app.get('env') === 'development') {
    logger.debug(`http.request.error stack=${err.stack || 'n/a'}`);
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(statusCode);
  res.json(res.locals.message);
});

module.exports = app;
