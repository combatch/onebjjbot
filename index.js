import config from './config/config';
import winston from './middleware/winston';
import Complex from './middleware/complexMiddleWare';
import Stocks from './middleware/stockMiddleware';
import ScreenShots from './imports/screenshots';

let env = process.env.NODE_ENV || 'development';


// loading middleware
// inserts loading gif
// edits comment to delete it when complete
// maybe some form of progress bar in the future
//
// command without regex match middleware
// spits out documentation if no match
// user enters "/stocks "
// bot replies with
// "usage: /stocks <ticker>" or something.


const Telegraf = require('telegraf');
const bot = new Telegraf(config[`${env}`]['token']);
const complexMiddleWare = new Complex();
const stocksMiddleware = new Stocks();


// middlewares
bot.use(Telegraf.memorySession());




bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
  winston.log('debug', 'symbol: ' + ctx.match[1]);
});

bot.hears(/ss (.+)/, (ctx) => {

  winston.log('debug', 'in the ss function');
  const ss = new ScreenShots();
  ss.createScreenshot(ctx);

})







bot.catch((err) => {
  winston.log('error', err);
})

bot.startPolling()
