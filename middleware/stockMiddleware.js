let request = require('request');
let winston = require('./winston');

class Stocks {

  constructor() {

  }

  getStocks(ctx, next) {

    return next().then(() => {
      winston.log('debug', 'test');
      request({
          url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + ctx.match[1] + '%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback='
        },
        function(error, response, body) {
          let data = JSON.parse(body);
          let symbolObj = {
            name: data.query.results.quote.Name,
            askingPrice: data.query.results.quote.Ask || '-Market Closed-',
            previousClose: data.query.results.quote.PreviousClose || 'Not Available',
            percentChange: data.query.results.quote.PercentChange || 'Not Available',
            peRatio: data.query.results.quote.PERatio || 'Not Available',
            yearRange: data.query.results.quote.YearRange || 'Not Available'
          }; 
          // winston.log('debug', data.query.results.quote);
          return ctx.replyWithHTML(`<b>${symbolObj.name}</b>  \n  \n<i>Asking Price: </i><strong>${symbolObj.askingPrice}</strong>  \n<i>Previous Close: </i><strong>${symbolObj.previousClose}</strong>  \n<i>Percent Change: </i><strong>${symbolObj.percentChange}</strong>  \n<i>PE Ratio: </i><strong>${symbolObj.peRatio}</strong>  \n<i>Year Range: </i><strong>${symbolObj.yearRange}</strong>`);
        }
      );

    })

  }

}

module.exports = Stocks;
