let path = require("path");
let winston = require("winston");
let conf = require("../config/config.js");
let _ = require("lodash");
let request = require("request");
let fs = require("fs");
let ScreenShots = require("../imports/screenshots");
let currency = require("currency-formatter");

let axios = require("axios");

let translate = require("npm-address-translator");

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
        let text = `<i>Balance</i> \n${satoshis} <strong>satoshis</strong> \n${
          bitcoin
        } <strong> BTC </strong>\n\nView transactions: https://blockchain.info/address/${address}`;
        return ctx.replyWithHTML(`${text}`, { disable_notification: true });
      }
    });
  }

  async getStats(ctx) {
    let fees = await this.getFees(ctx);
    let utxo = await this.getUnconfirmed(ctx);

    let est = 250 * fees / 100000000;

    let estimated = await this.modularConvert("BTC", "USD", est);
    estimated = this.formatPrice(estimated);

    let formatted = currency.format(utxo, {
      symbol: "",
      decimal: "",
      thousand: ",",
      precision: 0,
      format: "%s%v"
    });

    let string = `<b>${fees}</b> satoshis/byte recommended fee.\nestimated <b>${
      estimated
    }</b> fee for a regular tx.\n<b>${formatted}</b> unconfirmed transactions`;

    return ctx.replyWithHTML(`${string}`, { disable_notification: true });
  }

  async getFees(ctx) {
    return axios
      .get(`https://bitcoinfees.earn.com/api/v1/fees/recommended`)
      .then(x => {
        return x.data.fastestFee;
      })
      .catch(err => {
        winston.log("error", "failed in getFees", err);
      });
  }

  async getUnconfirmed(ctx) {
    return axios
      .get(`https://blockchain.info/q/unconfirmedcount`)
      .then(x => {
        let unconfirmed = x.data + 47000; //adjust for discrepency
        return unconfirmed;
      })
      .catch(err => {
        winston.log("error", "failed in getUnconfirmed", err);
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

  async getBitcoinityChart(ctx) {
    let date = new Date()
      .toString()
      .split(" ")
      .splice(1, 3)
      .join(" ");
    let caption = `btc price as of ${date}`;
    let bchcaption = `BCH price as of ${date}`;

    await ss.createScreenshot(ctx, "http://bitcoinity.org/markets", caption);
    await ss.createScreenshot(
      ctx,
      "https://bittrex.com/market/MarketStandardChart?marketName=USDT-BCC",
      bchcaption
    );
    return;
  }

  async translateAddress(ctx) {
    let address = ctx.match[0];
    let input = ctx.match.input;

    if (input == address) {
      let check = address.substring(0, 1);

      if (check == "1" || check == "3") {
        let string = await this.convertAddress(address);
        return ctx.replyWithHTML(`${string}`, {
          disable_notification: true
        });
      }
      if (check == "C" || check == "H") {
        let string = await this.convertAddress(address);
        return ctx.replyWithHTML(`${string}`, {
          disable_notification: true
        });
      }
    }
  }

  convertAddress(string) {
    let t = translate.translateAddress(string);
    let buildstring = `${t.origCoin} Address\n${string}\n\n${t.resultCoin} Address\n${
      t.resultAddress
    }`;
    return buildstring;
  }

  modularConvert(fromCurrency, to, amount) {
    return axios
      .get(`https://apiv2.bitcoinaverage.com/convert/global`, {
        params: {
          from: fromCurrency,
          to: to,
          amount: amount
        }
      })
      .then(x => {
        return x.data.price;
      })
      .catch(err => {
        winston.log("error", "failed in modularConvert", err);
      });
  }

  formatPrice(x) {
    return currency.format(x, {
      symbol: "$",
      decimal: ".",
      thousand: ",",
      precision: 2,
      format: "%s%v"
    });
  }
  convertToBitcoin(ctx) {
    let amount = ctx.match[1].replace(/\s+/, "");
    amount = Number(amount.replace(/[^0-9\.]+/g, ""));
    let fromCurrency = ctx.match[2].replace(/\s+/, "").toUpperCase();
    let to = ctx.match[4].replace(/\s+/, "").toUpperCase();

    switch (fromCurrency) {
      case "BCC":
        fromCurrency = "BCH";
        break;
    }
    switch (to) {
      case "BCC":
        to = "BCH";
        break;
    }

    let options = {
      method: "GET",
      url: "https://apiv2.bitcoinaverage.com/convert/global",
      qs: { from: fromCurrency, to: to, amount: amount },
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      console.log(response);

      if (response.statusCode == "200") {
        let data = JSON.parse(body);
        console.log(data);

        let price;

        if (fromCurrency == "BTC" || fromCurrency == "BCH") {
          price = this.formatPrice(data.price);
        } else {
          price = data.price;

          amount = currency.format(amount, {
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

module.exports = Bitcoin;
