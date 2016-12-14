let config = require('./config/config');
let winston = require('./middleware/winston');
let Stocks = require('./middleware/stockMiddleware');
let env = process.env.NODE_ENV || 'development';

const Telegraf = require('telegraf');
const bot = new Telegraf(config[`${env}`]['token']);
const stocksMiddleware = new Stocks();

// middlewares
bot.use(Telegraf.memorySession());
bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
	winston.log('debug','symbol: ' + ctx.match[1]);
});

bot.command('start', (ctx) => ctx.reply('Hey')) // type '/start'
bot.on('sticker', (ctx) => ctx.reply('👍')) // emojis work

// on any text message, increments session.counter
// as much logic should be moved to outside middleware as possible.
// this is just for learning / example.
// bot.on('text', (ctx) => {
//   winston.log('debug', ctx.session);
//   ctx.session.counter = ctx.session.counter || 0
//   ctx.session.counter++
//     return ctx.reply(`Message counter:${ctx.session.counter}`)
// })

bot.hears(/capture (.+)/i, (ctx) => {

  winston.log('debug', 'chat : ', ctx.chat);
  winston.log('debug', 'regex : ', ctx.match[1]);

  ctx.replyWithHTML(`<strong>your regex:</strong> is ${ctx.match[1]}`)

});


bot.catch((err) => {
  winston.log('error', err);
})

bot.startPolling()
