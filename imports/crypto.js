import path from 'path';
import winston from 'winston';
import conf from '../config/config.js';
import _ from 'lodash';
import request from 'request';
import fs from 'fs';
import ScreenShots from '../imports/screenshots';
const Poloniex = require('poloniex-api-node');
let poloniex = new Poloniex('conf.apis.poloapikey', 'conf.apis.polosecret');

const ss = new ScreenShots();




/** Class representing Crypto. */
class Crypto {

  /**
   * description would be here.
   */
  constructor() {

  }


  getTopVolume(ctx) {

    poloniex.return24Volume(function(err, ticker) {
      if (err) {
        winston.log('error', err);
      };

      delete ticker.totalBTC;
      delete ticker.totalETH;
      delete ticker.totalUSDT;
      delete ticker.totalXMR;
      delete ticker.totalXUSD;
      delete ticker['USDT_BTC'];



      let top = _.filter(ticker, 'BTC');
      top = _.sortBy(top, [o => Number(o.BTC)]).reverse();
      top = top.slice(0, 5);

      let string = `<b>Top Volume over 24 hours</b>\n\n`;

      let map = top.map( function(each){
        let Coin = Object.keys(each);
        let volume = Object.values(each);

        Coin = Coin[1];
        volume = Math.ceil(volume[0]).toLocaleString();

        string += `<i>${Coin}</i>  -- ${volume} BTC \n`;

      })


      return ctx.replyWithHTML(string, { });



    });


  }

  getCoinbaseExchangeRate(ctx) {

    let options = {
      method: 'GET',
      url: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) { console.log('debug', error) };
      let data = JSON.parse(body);
      let USD = data.data.rates.USD;

      if (error) {
        return ctx.reply(`${error} error`);
      } else {
        let text = `1 BTC = $ ${USD}`;
        return ctx.replyWithHTML(`${text}`, { disable_notification: true });
      }

    });


  }

  getCryptoityChart(ctx) {

    let date = (new Date()).toString().split(' ').splice(1, 3).join(' ');
    let caption = `btc price as of ${date}`;

    return ss.createScreenshot(ctx, 'http://Cryptoity.org/markets', caption);

  }


  convertToCrypto(ctx) {

    let amount = ctx.match[1].replace(/\s+/, "");
    amount = Number(amount.replace(/[^0-9\.]+/g, ""));
    let fromCurrency = ctx.match[2].replace(/\s+/, "").toUpperCase();
    let to = ctx.match[4].replace(/\s+/, "").toUpperCase();

    let options = {
      method: 'GET',
      url: 'https://apiv2.Cryptoaverage.com/convert/global',
      qs: { from: fromCurrency, to: to, amount: amount },
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {

      if (response.statusCode == '200') {
        let data = JSON.parse(body);
        return ctx.replyWithHTML(`${amount} ${fromCurrency} = ${data.price} ${to}`, { disable_notification: true });
      } else {
        return ctx.replyWithHTML(`usage: convert (amount) (currency) to (currency)`, { disable_notification: true });
      }

    });

  }


}





export default Crypto;
