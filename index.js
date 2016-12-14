let config = require('./config/config');
let winston = require('./middleware/winston');
let singleMiddleWareTest = require('./middleware/singleMiddleWareTest');
let Complex = require('./middleware/complexMiddleWare');
let Stocks = require('./middleware/stockMiddleware');
let utils = require('./middleware/utils');

let env = process.env.NODE_ENV || 'development';

let Horseman = require('node-horseman');

let fs = require('fs');
let path = require('path');
let URL = require('url');
let dir = __dirname + '/tmp/'
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}



const Telegraf = require('telegraf');
const bot = new Telegraf(config[`${env}`]['token']);
const complexMiddleWare = new Complex();
const stocksMiddleware = new Stocks();
// const UTILs = new utils();

// middlewares
bot.use(Telegraf.memorySession());
bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
	winston.log('debug','symbol: ' + ctx.match[1]);
});
// bot.use(singleMiddleWareTest); // has a single function
// bot.use(complexMiddleWare.time); // idea is to have multiple functions
// bot.use(complexMiddleWare.otherExample); // idea is to have multiple functions



bot.hears(/capture (.+)/i, (ctx) => {

  winston.log('debug', ctx.from);
  winston.log('debug', 'chat : ', ctx.chat);
  winston.log('debug', 'regex : ', ctx.match[1]);

  ctx.replyWithHTML(`<strong>your regex:</strong> is ${ctx.match[1]}`)

});

bot.hears(/ss (.+)/,  (ctx) => {

  let website = ctx.match[1];
  winston.log('debug', website);
  let parsedUrl = URL.parse(website);
  let horseman = new Horseman();

  horseman
    .viewport(3200,1800)
    .zoom(2)
    .open('http://www.horsemanjs.org')
    .log('something')
    .screenshot(__dirname + 'big.png')
    .close();

  // horseman
  //   .viewport(1600, 900)
  //   .zoom(2)
  //   .open(parsedUrl)
  //   .log('i here')
  //   .waitForNextPage()
  //   .screenshot(__dirname + `/tmp/${parsedUrl}.png`)
  //   .then(() => {
  //       winston.log('debug', 'in the then function');
  //     // var Screenshot = __dirname + `/tmp/${parsedUrl}.png`;

  //     // ctx.replyWithHTML(`<strong>your regex:</strong> is ${ctx.match[1]}`)
  //     // bot.sendPhoto(fromId, Screenshot, { caption: `btc price as of ${date}` });
  //   })
  //   .close();


})





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

bot.catch((err) =>{
    winston.log('error',  err);
})

bot.startPolling()


module.exports = bot;
