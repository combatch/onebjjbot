import path from "path";
import winston from "winston";
import conf from "../config/config.js";
import _ from "lodash";
import request from "request";
import currency from "currency-formatter";
import fs from "fs";
import ScreenShots from "../imports/screenshots";
const Poloniex = require("poloniex-api-node");
let poloniex = new Poloniex("conf.apis.poloapikey", "conf.apis.polosecret");

const ss = new ScreenShots();

/** Class representing Crypto. */
class Crypto {
  /**
   * description would be here.
   */
  constructor() {}

  getTopVolume(ctx) {
    poloniex.return24Volume(function(err, ticker) {
      if (err) {
        winston.log("error", err);
      }

      delete ticker.totalBTC;
      delete ticker.totalETH;
      delete ticker.totalUSDT;
      delete ticker.totalXMR;
      delete ticker.totalXUSD;
      delete ticker["USDT_BTC"];
      delete ticker["BTC_XRP"];

      let top = _.filter(ticker, "BTC");
      top = _.sortBy(top, [o => Number(o.BTC)]).reverse();
      top = top.slice(0, 5);

      let string = `<b>Top Volume over 24 hours</b>\n\n`;

      let map = top.map(function(each) {
        let Coin = Object.keys(each);
        let volume = Object.values(each);

        Coin = Coin[1];

        winston.log("debug", Coin);

        volume = Math.ceil(volume[0]).toLocaleString();

        string += `<i>${Coin}</i>  -- ${volume} BTC \n`;
      });

      return ctx.replyWithHTML(string, {});
    });
  }

  getCoinCapVolume(ctx) {
    let options = {
      method: "GET",
      url: "http://coincap.io/front",
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        winston.log("error", error);
      }
      let data = JSON.parse(body);

      let btc = _.filter(data, { short: "BTC" });
      let remaining = 21000000 - btc[0]["supply"];
      remaining = currency.format(remaining, {
        decimal: "",
        thousand: ",",
        precision: 0,
        format: "%v"
      });
      btc = btc[0]["price"];

      let top = _.reject(data, { short: "XRP" });
      top = _.reject(top, { volume: "NaN" });
      top = _.reject(top, { short: "BTC" });
      top = _.sortBy(top, [o => Number(o.volume)]).reverse();
      top = top.slice(0, 6);

      let string = `<b>Top Volume over 24 hours</b>\n${remaining} Bitcoin remain.\n\n`;

      let map = top.map(function(each) {
        let Ticker = each["short"];
        let Coin = each["long"];
        let volume = currency.format(each["volume"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 0,
          format: "%s%v"
        });
        let price = currency.format(each["price"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 2,
          format: "%s%v"
        });
        let change = each["cap24hrChange"];
        if (change.indexOf("-")) {
          change = `+${change}`;
        }
        let pairing = each["price"] / btc;
        pairing = _.ceil(pairing, 5);

        string += `<strong>${Coin}</strong>  -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 BTC = ${pairing} ${Ticker}\n\n`;
      });

      return ctx.replyWithHTML(string, {});
    });
  }

  getBiggestLosers(ctx) {
    let options = {
      method: "GET",
      url: "http://coincap.io/front",
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        winston.log("error", error);
      }
      let data = JSON.parse(body);

      let top = _.reject(data, { short: "XRP" });
      let btc = _.filter(data, { short: "BTC" });
      btc = btc[0]["price"];

      top = _.sortBy(top, [o => Number(o.cap24hrChange)]);
      top = top.slice(0, 6);

      let string = `<b>Biggest Losers over 24 hours</b>\n\n`;

      let map = top.map(function(each) {
        let Ticker = each["short"];
        let Coin = each["long"];
        let volume = currency.format(each["volume"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 0,
          format: "%s%v"
        });
        let price = currency.format(each["price"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 2,
          format: "%s%v"
        });
        let change = each["cap24hrChange"];
        let pairing = each["price"] / btc;
        pairing = _.ceil(pairing, 5);

        string += `<strong>${Coin}</strong>  -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 BTC = ${pairing} ${Ticker}\n\n`;
      });

      return ctx.replyWithHTML(string, {});
    });
  }

  getBiggestWinners(ctx) {
    let options = {
      method: "GET",
      url: "http://coincap.io/front",
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        winston.log("error", error);
      }
      let data = JSON.parse(body);

      let top = _.reject(data, { short: "XRP" });
      let btc = _.filter(data, { short: "BTC" });
      btc = btc[0]["price"];

      top = _.sortBy(top, [o => Number(o.cap24hrChange)]).reverse();
      top = top.slice(0, 6);

      let string = `<b>Biggest Winners over 24 hours</b>\n\n`;

      let map = top.map(function(each) {
        let Ticker = each["short"];
        let Coin = each["long"];
        let volume = currency.format(each["volume"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 0,
          format: "%s%v"
        });
        let price = currency.format(each["price"], {
          symbol: "$",
          decimal: ".",
          thousand: ",",
          precision: 2,
          format: "%s%v"
        });
        let change = each["cap24hrChange"];
        let pairing = each["price"] / btc;
        pairing = _.ceil(pairing, 5);

        string += `<strong>${Coin}</strong>  -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 BTC = ${pairing} ${Ticker}\n\n`;
      });

      return ctx.replyWithHTML(string, {});
    });
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

  getCryptoityChart(ctx) {
    let date = new Date().toString().split(" ").splice(1, 3).join(" ");
    let caption = `btc price as of ${date}`;

    return ss.createScreenshot(ctx, "http://Cryptoity.org/markets", caption);
  }

  convertToCrypto(ctx) {
    let amount = ctx.match[1].replace(/\s+/, "");
    amount = Number(amount.replace(/[^0-9\.]+/g, ""));
    let fromCurrency = ctx.match[2].replace(/\s+/, "").toUpperCase();
    let to = ctx.match[4].replace(/\s+/, "").toUpperCase();

    let options = {
      method: "GET",
      url: "https://apiv2.Cryptoaverage.com/convert/global",
      qs: { from: fromCurrency, to: to, amount: amount },
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (response.statusCode == "200") {
        let data = JSON.parse(body);
        return ctx.replyWithHTML(`${amount} ${fromCurrency} = ${data.price} ${to}`, {
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

export default Crypto;
