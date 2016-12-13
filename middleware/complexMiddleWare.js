let winston = require('./winston');

let time = (ctx, next) => {
  const start = new Date()
  return next().then(() => {
    const ms = new Date() - start
    winston.log('debug', 'Response time %sms', ms)
  })
};

// this is actually not working the way expected yet.
let otherExample = (ctx, next) => {
  winston.log('debug', 'other middle ware example. two functions')
  .then(next);
};

module.exports = time;
