let config = require('./config/config');
let winston = require('./middleware/winston');
let singleMiddleWareTest = require('./middleware/singleMiddleWareTest');
let Complex = require('./middleware/complexMiddleWare');
let Stocks = require('./middleware/stockMiddleware');
let utils = require('./middleware/utils');

let env = process.env.NODE_ENV || 'development';

let Horseman = require('node-horseman');

// move out to utils eventually
let fs = require('fs-extra');
let path = require('path');
let URL = require('url');
let _ = require('lodash');
let dir = __dirname + '/tmp/'
if (!fs.existsSync(dir)) {
  fs.mkdirsSync(dir);
}



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
// const UTILs = new utils();

// middlewares
bot.use(Telegraf.memorySession());
bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
  winston.log('debug', 'symbol: ' + ctx.match[1]);
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

bot.hears(/ss (.+)/, (ctx) => {

  let query = ctx.match[1];
  let parsedUrl = URL.parse(query);
  let website = parsedUrl.href;
  let cleanUrl = (parsedUrl.protocol == null ? `http://${website}` : website)
  let cleanString = (parsedUrl.protocol == 'https:' ? _.replace(website, "https://", '') : _.replace(website, "http://", ''));
  let dirString = _.replace(cleanString, /\/+/g, "-");
  let screenshot = `${dir}${dirString}.png`;
  let horseman = new Horseman();

  horseman
    .viewport(3200, 1800)
    .zoom(2)
    .open(cleanUrl)
    .screenshot(screenshot)
    .then(() => {
      winston.log('info', 'screenshot saved', cleanString);
      let ss = fs.createReadStream(screenshot);
      ctx.replyWithPhoto({ source: ss }, { caption: `screenshot of ${cleanUrl}`, disable_notification: true });
    })
    .catch((err) => {
      ctx.reply(`an error occured with that URL. check logs for more info`, { reply_to_message_id: ctx.message.message_id })
      winston.log('error', err);
    })
    .close();

})






bot.catch((err) => {
  winston.log('error', err);
})

bot.startPolling()



