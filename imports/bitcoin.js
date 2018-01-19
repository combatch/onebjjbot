let path = require('path');
let winston = require('winston');
let conf = require('../config/config.js');
let _ = require('lodash');
let request = require('request');
let fs = require('fs');
let ScreenShots = require('../imports/screenshots');
let currency = require('currency-formatter');

let axios = require('axios');

let translate = require('npm-address-translator');
const bitcoinCash = require('bitcoincashjs');

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
      method: 'GET',
      url: 'https://blockchain.info/address/' + address + '?format=json',
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) {
        console.log('debug', error);
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

  async getStats(ctx) {
    let fees = await this.getFees(ctx);
    let utxo = await this.getUnconfirmed(ctx);

    let est = 250 * fees / 100000000;

    let estimated = await this.modularConvert('BTC', 'USD', est);
    estimated = this.formatPrice(estimated);

    let formatted = currency.format(utxo, {
      symbol: '',
      decimal: '',
      thousand: ',',
      precision: 0,
      format: '%s%v'
    });

    let string = `<b>${fees}</b> satoshis/byte recommended fee.\nestimated <b>${estimated}</b> fee for a regular tx.\n<b>${formatted}</b> unconfirmed transactions`;

    return ctx.replyWithHTML(`${string}`, { disable_notification: true });
  }

  async getFees(ctx) {
    return axios
      .get(`https://bitcoinfees.earn.com/api/v1/fees/recommended`)
      .then(x => {
        return x.data.fastestFee;
      })
      .catch(err => {
        winston.log('error', 'failed in getFees', err);
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
        winston.log('error', 'failed in getUnconfirmed', err);
      });
  }

  getCoinbaseExchangeRate(ctx) {
    let options = {
      method: 'GET',
      url: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) {
        console.log('debug', error);
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
      .split(' ')
      .splice(1, 3)
      .join(' ');
    let caption = `btc price as of ${date}`;
    let bchcaption = `BCH price as of ${date}`;

    await ss.createScreenshot(ctx, 'http://bitcoinity.org/markets', caption);
    await ss.createScreenshot(
      ctx,
      'https://bittrex.com/market/MarketStandardChart?marketName=USDT-BCC',
      bchcaption
    );
    return;
  }

  async translateAddress(ctx, noprefix = false) {
    let address = ctx.match[0];
    let input;

    if (ctx.match['index'] <= 20 && ctx.match['index'] >= 12) {
      address = ctx.match.input;
    }
    input = ctx.match.input;
    if (noprefix) {
      address = `bitcoincash:${address}`;
      input = address;
    }

    if (input == address) {
      let check = address.substring(0, 1);

      if (check == '1' || check == '3') {
        let string = await this.convertAddress(ctx, address, 'legacy');
        return ctx.replyWithHTML(`${string}`, {
          disable_notification: true
        });
      }
      if (check == 'C' || check == 'H') {
        let string = await this.convertAddress(ctx, address, 'bitpay');
        return ctx.replyWithHTML(`${string}`, {
          disable_notification: true
        });
      }
      if (check == 'b' || check == 'B') {
        let string = await this.convertAddress(ctx, address, 'cash');
        return ctx.replyWithHTML(`${string}`, {
          disable_notification: true
        });
      }
    }
  }

  async convertAddress(ctx, string, type) {
    const Address = bitcoinCash.Address;
    const BitpayFormat = Address.BitpayFormat;
    const CashAddrFormat = Address.CashAddrFormat;
    let address;

    try {
      if (type == 'bitpay') {
        let t = translate.translateAddress(string);
        let bch = t.resultAddress;

        address = new Address(bch);
      } else if (type == 'cash') {
        let translated;
        let check = string.charAt(12);

        if (check == 'p') {
          let pubscripthash = Address.fromString(
            string,
            'mainnet',
            'scripthash',
            CashAddrFormat
          );
          translated = pubscripthash.toString();
        } else if (check == 'q') {
          let cashaddr = Address.fromString(
            string,
            'mainnet',
            'pubkeyhash',
            CashAddrFormat
          );
          translated = cashaddr.toString();
        }

        address = new Address(translated);
      } else {
        address = new Address(string);
      }

      let legacy = address.toString();
      let bitpay = address.toString(BitpayFormat);
      let cash = address.toString(CashAddrFormat);

      let buildstring;

      let instructions = `Use this Address translation below. The address beginning with <i>1</i> or <i>3</i> will work everywhere`;

      await ctx.replyWithHTML(`${instructions}`, {
        disable_notification: true
      });
      if (string == legacy) {
        buildstring = `<b>${cash}</b>`;
      }
      if (string == bitpay) {
        buildstring = `<b>${cash}</b>`;
      }
      if (string == cash) {
        buildstring = `<b>${legacy}</b>`;
      }
      return buildstring;
    } catch (e) {
      console.log(e, typeof e);
      return ctx.replyWithHTML(`error: ${e.Error}`);
    }
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
        winston.log('error', 'failed in modularConvert', err);
      });
  }

  convertToBitcoin(ctx) {
    let amount = ctx.match[1].replace(/\s+/, '');
    amount = Number(amount.replace(/[^0-9\.]+/g, ''));
    let fromCurrency = ctx.match[2].replace(/\s+/, '').toUpperCase();
    let to = ctx.match[4].replace(/\s+/, '').toUpperCase();
    let bits;

    switch (fromCurrency) {
      case 'BCC':
        fromCurrency = 'BCH';
      case 'BITS':
        bits = true;
        fromCurrency = 'BCH';
        break;
    }

    switch (to) {
      case 'BCC':
        to = 'BCH';
      case 'BITS':
        bits = true;
        to = 'BCH';
        break;
      case 'BIT':
        bits = true;
        to = 'BCH';
        break;
    }

    let options = {
      method: 'GET',
      url: 'https://apiv2.bitcoinaverage.com/convert/global',
      qs: { from: fromCurrency, to: to, amount: amount },
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (response.statusCode == '200') {
        let data = JSON.parse(body);

        let price = data.price;

        console.log('amount', amount);

        if (fromCurrency == 'USD') {
          amount = currency.format(amount, {
            symbol: '$',
            decimal: '.',
            thousand: ',',
            precision: 2,
            format: '%s%v'
          });
        }

        // else {
        //   amount = currency.format(amount, {
        //     symbol: "",
        //     decimal: ".",
        //     thousand: ",",
        //     precision: 0,
        //     format: "%s%v"
        //   });
        // }

        if (to == 'USD') {
          price = currency.format(price, {
            symbol: '$',
            decimal: '.',
            thousand: ',',
            precision: 2,
            format: '%s%v'
          });
        }

        console.log('amount', amount);

        if (bits) {
          switch (fromCurrency) {
            case 'BCH':
              fromCurrency = 'bits';
              break;
          }
          switch (to) {
            case 'BCH':
              to = 'bits';
              break;
          }

          if (fromCurrency == 'USD') {
            let bits = data.price * 1000000;

            price = currency.format(bits, {
              symbol: '',
              decimal: '',
              thousand: ',',
              precision: 0,
              format: '%s%v'
            });
          } else {
            let bits = data.price / 1000000;

            price = currency.format(bits, {
              symbol: '$',
              decimal: '.',
              thousand: ',',
              precision: 2,
              format: '%s%v'
            });
          }
        }

        return ctx.replyWithHTML(`${amount} ${fromCurrency} = ${price} ${to}`, {
          disable_notification: true
        });
      } else {
        return ctx.replyWithHTML(
          `usage: convert (amount) (currency) to (currency)`,
          {
            disable_notification: true
          }
        );
      }
    });
  }

  formatPrice(x) {
    let price = currency.format(x, {
      symbol: '$',
      decimal: '.',
      thousand: ',',
      precision: 2,
      format: '%s%v'
    });

    return price;
  }
}

module.exports = Bitcoin;
