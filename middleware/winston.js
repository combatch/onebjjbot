let winston = require('winston');
let env = process.env.NODE_ENV || 'development';

require('winston-papertrail').Papertrail;

// move to koa middleware
winston.configure({
  transports: [
      new(winston.transports.Console)({
        level: 'debug',
        colorize: true,
        prettyPrint: true
      }),
      new(winston.transports.File)({
        filename: 'logs/telegrambot.log',
        level: 'info'
      })
    ]
});

if (env == 'production') {
  winston.add(winston.transports.Papertrail, {
    host: 'logs5.papertrailapp.com',
    port: 47865,
    level: 'debug',
    colorize: true,
    prettyPrint: true
  });
};

module.exports = winston;