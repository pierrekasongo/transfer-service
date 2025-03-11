'use strict';

const pino = require('pino');

const config = require('./config').getConfig();

const logger = pino({
  level: config.logLevel,
  pinoHttp: {
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'req.headers,res',
      },
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
  enabled: config.enableLogging,
});

module.exports = logger;
