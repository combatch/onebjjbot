import config from './config/config';
import winston from './middleware/winston';
import Complex from './middleware/complexMiddleWare';
import Stocks from './middleware/stockMiddleware';
import Knex from './imports/knex';
import ScreenShots from './imports/screenshots';
import Users from './imports/users';
import Vote from './imports/vote';
import Files from './imports/fileStreams';

let env = process.env.NODE_ENV || 'development';

const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const bot = new Telegraf(config[`${env}`]['token']);
const complexMiddleWare = new Complex();
const stocksMiddleware = new Stocks();
const migrations = new Knex();
const user = new Users();
const vote = new Vote();

migrations.migrateLatest();


// middlewares
bot.use(Telegraf.memorySession());

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})





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

  let lol = "l+o+l.*";
  let lolRegEx = new RegExp(lol, "ig");
  let upvote = "upvote";
  let upvoteRegEx = new RegExp(upvote, "ig");

  if (ctx.message.reply_to_message) {
    if (lolRegEx.test(ctx.message.text) || upvoteRegEx.test(ctx.message.text) || ctx.message.text == 'haha') {
      let userId = ctx.from.id;
      let replyTo = ctx.message.reply_to_message.from.id;
      let originalMessageId = ctx.message.reply_to_message.message_id;

      return ctx.reply('<i>choose a button to upvote</i>', Extra
        .inReplyTo(originalMessageId)
        .notifications(false)
        .HTML()
        .markup(
          Markup.inlineKeyboard([
            Markup.callbackButton('😂', 'tearsofjoy'),
            Markup.callbackButton('👍', 'thumbsup'),
            Markup.callbackButton('❤️', 'heart'),
            Markup.callbackButton('🔥', 'fire'),
            Markup.callbackButton('👏', 'clap'),
            Markup.callbackButton('😀', 'grin')
          ])))

    }
  }
});



bot.action('tearsofjoy', (ctx, next) => {
  return ctx.answerCallbackQuery('selected 😂')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);
})
bot.action('thumbsup', (ctx, next) => {
  return ctx.answerCallbackQuery('selected 👍')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);
})
bot.action('heart', (ctx, next) => {
  return ctx.answerCallbackQuery('selected ❤')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);;
})
bot.action('fire', (ctx, next) => {
  return ctx.answerCallbackQuery('selected 🔥')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);
})
bot.action('clap', (ctx, next) => {
  return ctx.answerCallbackQuery('selected 👏')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);
})
bot.action('grin', (ctx, next) => {
  return ctx.answerCallbackQuery('selected 😀')
    .then(() => {
      vote.voteMiddleware(ctx);
    })
    .then(next);
})


bot.catch((err) => {
  winston.log('debug', 'in bot catch error');
  winston.log('error', err);
})

bot.startPolling()
