const winston = require('winston');

if (!global.__CTDC_WINSTON_INITIALIZED__) {
  winston.add(new winston.transports.Console());
  global.__CTDC_WINSTON_INITIALIZED__ = true;
}

module.exports = winston;
