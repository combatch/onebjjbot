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
      top = _.reject(top, { short: "USDT" });
      top = _.sortBy(top, [o => Number(o.volume)]).reverse();
      top = top.slice(0, 5);

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

        if (change < 0) {
          change = `⬇ ${Math.abs(change)}`;
        } else {
          change = `⬆ ${Math.abs(change)}`;
        }

        let pairing = each["price"] / btc;
        pairing = _.ceil(pairing, 5);

        string += `<strong>${Coin}</strong>  24 hr Volume -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 ${Ticker} = ${pairing} BTC\n\n`;
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
      let topSeventyFive = data.slice(0, 75);

      let top = _.reject(topSeventyFive, { short: "XRP", shapeshift: false });
      let btc = _.filter(data, { short: "BTC" });
      btc = btc[0]["price"];

      top = _.sortBy(top, [o => Number(o.cap24hrChange)]);
      top = top.slice(0, 4);

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

        string += `<strong>${Coin}</strong>  -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 ${Ticker} = ${pairing} BTC\n\n`;
      });

      return ctx.replyWithHTML(string, {});
    });
  }

  // test(ctx, coin) {
  //   let options = {
  //     method: "GET",
  //     url: `http://coincap.io/history/1day/${coin}`,
  //     headers: { "cache-control": "no-cache" }
  //   };

  //   request(options, function(error, response, body) {
  //     if (error) {
  //       winston.log("error", error);
  //     }
  //     let data = JSON.parse(body);
  //     winston.log("info", data);

  //   });
  // }

  getBitcoinPrices(ctx) {
    let userID = ctx.message.from.id;
    let first_name = ctx.message.from.first_name;

    let options = {
      method: "GET",
      url: "http://coincap.io/front",
      headers: { "cache-control": "no-cache" }
    };

    ctx.replyWithChatAction("typing");

    request(options, function(error, response, body) {
      if (error) {
        winston.log("error", error);
      }
      let data = JSON.parse(body);

      let btc = _.filter(data, { short: "BTC" });

      let btcChange = btc[0]["cap24hrChange"];

      if (btcChange < 0) {
        btcChange = `⬇ ${Math.abs(btcChange)}`;
      } else {
        btcChange = `⬆ ${Math.abs(btcChange)}`;
      }

      let btcremaining = 21000000 - btc[0]["supply"];
      btcremaining = currency.format(btcremaining, {
        decimal: "",
        thousand: ",",
        precision: 0,
        format: "%v"
      });

      let btcPrice = currency.format(btc[0]["price"], {
        symbol: "$",
        decimal: ".",
        thousand: ",",
        precision: 2,
        format: "%s%v"
      });

      let bcc = _.filter(data, { long: "Bitcoin Cash" });

      let bccChange = bcc[0]["cap24hrChange"];

      if (bccChange < 0) {
        bccChange = `⬇ ${Math.abs(bccChange)}`;
      } else {
        bccChange = `⬆ ${Math.abs(bccChange)}`;
      }

      let bccremaining = 21000000 - bcc[0]["supply"];
      bccremaining = currency.format(bccremaining, {
        decimal: "",
        thousand: ",",
        precision: 0,
        format: "%v"
      });

      let bccPrice = currency.format(bcc[0]["price"], {
        symbol: "$",
        decimal: ".",
        thousand: ",",
        precision: 2,
        format: "%s%v"
      });

      switch (bcc[0]["short"]) {
        case "BCH":
          bcc[0]["short"] = "BCC";
          break;
      }

      let string = `\n1 ${bcc[0][
        "short"
      ]} = <b>${bccPrice}</b>\n<i>${bccChange}%</i>\n${bccremaining} coins left\n\n1 ${btc[0][
        "short"
      ]} = <b>${btcPrice}</b>\n<i>${btcChange}%</i>\n${btcremaining} coins left`;

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
      let topSeventyFive = data.slice(0, 75);

      let top = _.reject(topSeventyFive, { short: "XRP", shapeshift: false });
      top = _.reject(top, { short: "USDT" });
      let btc = _.filter(data, { short: "BTC" });
      btc = btc[0]["price"];

      top = _.sortBy(top, [o => Number(o.cap24hrChange)]).reverse();
      top = top.slice(0, 4);

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

        string += `<strong>${Coin}</strong>  -- ${volume}  \n<i>${change}% </i> \n1 ${Ticker} = ${price}\n1 ${Ticker} = ${pairing} BTC\n\n`;
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

  getBitcoinityChart(ctx) {
    let date = new Date()
      .toString()
      .split(" ")
      .splice(1, 3)
      .join(" ");
    let caption = `btc price as of ${date}`;

    return ss.createScreenshot(ctx, "http://Bitcoinity.org/markets", caption);
  }
}

export default Crypto;
