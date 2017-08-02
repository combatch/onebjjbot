import path from "path";
import winston from "winston";
import conf from "../config/config.js";
import _ from "lodash";
import request from "request";
import fs from "fs";
import ScreenShots from "../imports/screenshots";
import currency from "currency-formatter";

const ss = new ScreenShots();

/** Class representing Bitcoin. */
class Bitcoin {
  /**
   * description would be here.
   */
  constructor() {}

  /**
   * runs Bitcoin
   * @param {object} ctx - telegraf context object.
   */
  getBalance(ctx) {
    let address = ctx.match[1];
    let replyTo = ctx.update.message.message_id;

    let options = {
      method: "GET",
      url: "https://blockchain.info/address/" + address + "?format=json",
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        console.log("debug", error);
      }
      let data = JSON.parse(body);
      let satoshis = data.final_balance;
      let bitcoin = data.final_balance / 100000000;

      if (error) {
        return ctx.reply(`${error} error`);
      } else {
        let text = `<i>Balance</i> \n${satoshis} <strong>satoshis</strong> \n${bitcoin} <strong> BTC </strong>\n\nView transactions: https://blockchain.info/address/${address}`;
        return ctx.replyWithHTML(`${text}`, { disable_notification: true });
      }
    });
  }

  getLiveTicker(ctx) {
    let group = ctx.chat.id;
    let messageId = ctx.update.message.message_id;

    let p = Promise.resolve(this.getCoinbaseExchangeRate(ctx));
    p
      .then(exists => {
        if (exists) {
          winston.log("debug", exists);

          ctx.replyWithHTML(`<strong> ${exists}</strong>`);
        } else {
          winston.log("debug", exists);
          ctx.replyWithHTML(`<strong>doesnt exist</strong>`);
        }
      })
      .then(() => {
        ctx.replyWithHTML(`<strong> in promise</strong>`);
      });

    //this.startUpdates(ctx);
  }

  stopLiveTicker(ctx) {
    return stopUpdates();
  }

  startUpdates(ctx) {
    setInterval(function() {}, 2000);
  }

  getCoinbaseExchangeRate(ctx) {
    let options = {
      method: "GET",
      url: "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        console.log("debug", error);
      }
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

  getBitcoinityChart(ctx) {
    let date = new Date().toString().split(" ").splice(1, 3).join(" ");
    let caption = `btc price as of ${date}`;

    return ss.createScreenshot(ctx, "http://bitcoinity.org/markets", caption);
  }

  convertToBitcoin(ctx) {
    let amount = ctx.match[1].replace(/\s+/, "");
    amount = Number(amount.replace(/[^0-9\.]+/g, ""));
    let fromCurrency = ctx.match[2].replace(/\s+/, "").toUpperCase();
    let to = ctx.match[4].replace(/\s+/, "").toUpperCase();

    let options = {
      method: "GET",
      url: "https://apiv2.bitcoinaverage.com/convert/global",
      qs: { from: fromCurrency, to: to, amount: amount },
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (response.statusCode == "200") {
        let data = JSON.parse(body);
        let price;

        if (fromCurrency == "BTC") {
          price = currency.format(data.price, {
            symbol: "$",
            decimal: ".",
            thousand: ",",
            precision: 2,
            format: "%s%v"
          });
        } else {
          price = data.price;
          amount = currency.format(data.price, {
            symbol: "$",
            decimal: ".",
            thousand: ",",
            precision: 2,
            format: "%s%v"
          });
        }

        return ctx.replyWithHTML(`${amount} ${fromCurrency} = ${price} ${to}`, {
          disable_notification: true
        });
      } else {
        return ctx.replyWithHTML(`usage: convert (amount) (currency) to (currency)`, {
          disable_notification: true
        });
      }
    });
  }
}

export default Bitcoin;
