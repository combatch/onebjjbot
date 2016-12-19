import config from './config/config';
import winston from './middleware/winston';
import Complex from './middleware/complexMiddleWare';
import Stocks from './middleware/stockMiddleware';
import Knex from './imports/knex';
import ScreenShots from './imports/screenshots';
import Users from './imports/users';
import Files from './imports/fileStreams';

let env = process.env.NODE_ENV || 'development';

const Telegraf = require('telegraf');
const bot = new Telegraf(config[`${env}`]['token']);
const complexMiddleWare = new Complex();
const stocksMiddleware = new Stocks();
const migrations = new Knex();
const user = new Users();

migrations.migrateLatest();


// middlewares
bot.use(Telegraf.memorySession());


bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
  winston.log('debug', 'symbol: ' + ctx.match[1]);
});

bot.hears(/\/ss (.+)/, (ctx) => {

  winston.log('debug', 'in the ss function'); // left debug messages for now
  const ss = new ScreenShots(); // the class
  ss.createScreenshot(ctx); // the method

})


bot.command('register', (ctx) => {

  winston.log('debug', 'in register command');
  user.registerUser(ctx);

});



bot.command('leaderboard', (ctx) => {
  user.getLeaderboard(ctx);
});



bot.on('message', (ctx) => {
  if (ctx.message.reply_to_message) {
    if (ctx.message.text == 'lol') {
      let userId = ctx.from.id;
      // insert inline buttons with emojis
      // increment

    }
  }
});


bot.catch((err) => {
  winston.log('debug', 'in bot catch error');
  winston.log('error', err);
})

bot.startPolling()
