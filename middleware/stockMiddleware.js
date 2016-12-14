let request = require('request');
let winston = require('./winston');

class Stocks {

  constructor() {

  }

  getStocks(ctx, next) {

    return next().then(() => {
      winston.log('debug', 'test');
      request({
          url: 'http://autoc.finance.yahoo.com/autoc?query=alphabet&region=EU&lang=en-GB'
        },
        function(error, response, body) {
        	winston.log('debug', body);
          return ctx.reply(JSON.parse(body));
        }
      );

    })

  }

}

module.exports = Stocks;
