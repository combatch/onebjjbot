let winston = require('./winston');


class Complex {

  constructor() {

  }

  time(ctx, next) {
    const start = new Date();

    return next().then(() => {

      const ms = new Date() - start
      winston.log('debug', 'Response time %sms', ms)

    })
  }

  otherExample(ctx, next) {

    return next().then(() => {

      winston.log('debug', 'other middle ware example. two functions')
      return ctx.reply(`message from Complex Class, otherExample method`)

    })

  }

}

module.exports = Complex;
