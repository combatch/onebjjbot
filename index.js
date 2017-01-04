import config from './config/config';
import winston from './middleware/winston';
import Complex from './middleware/complexMiddleWare';
import Stocks from './middleware/stockMiddleware';
import Knex from './imports/knex';
import ScreenShots from './imports/screenshots';
import Users from './imports/users';
import Vote from './imports/vote';
import Google from './imports/google';
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
const google = new Google();


//migrations.migrateLatest();


// middlewares
bot.use(Telegraf.memorySession());

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
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


bot.hears(/translate (.+)/i, (ctx) => {

  if (ctx.message.reply_to_message) {
    google.translate(ctx);
  } else {
    return ctx.reply('usage: reply to a message with "translate <foreignlanguage>"');
  }

});

bot.command('leaderboard', (ctx) => {
  user.getLeaderboard(ctx);
});

// bot.hears(/gif (.+)/ig, google.getGifs, (ctx) => {
//   return console.log('something happened');
// });

bot.hears(/reaction (.+)/ig, (ctx) => {
  return google.tenorSearch(ctx);
});





// if replying with emoji, auto increment
bot.on('message', (ctx) => {


  let lol = "l+o+l.*";
  let lolRegEx = new RegExp(lol, "ig");
  let upvote = "upvote";
  let upvoteRegEx = new RegExp(upvote, "ig");
  let lmao = "l+m+a+o+";
  let lmaoRegEx = new RegExp(lmao, "ig");

  if (ctx.message.reply_to_message) {

    if (lolRegEx.test(ctx.message.text) || upvoteRegEx.test(ctx.message.text) || lmaoRegEx.test(ctx.message.text) || ctx.message.text == 'haha') {

      let userId = ctx.from.id;
      let replyTo = ctx.message.reply_to_message.from.id;
      let originalMessageId = ctx.message.reply_to_message.message_id;

      if (userId == replyTo) {
        return ctx.reply('cant vote for yourself');
      }


      return ctx.reply('<i>choose a button to upvote</i>', Extra
        .inReplyTo(originalMessageId)
        .notifications(false)
        .HTML()
        .markup(
          Markup.inlineKeyboard([
            Markup.callbackButton('😂', 'tearsofjoy'),
            Markup.callbackButton('👍', 'thumbsup'),
            Markup.callbackButton('❤', 'heart'),
            Markup.callbackButton('🔥', 'fire'),
            Markup.callbackButton('👏', 'clap'),
            Markup.callbackButton('😀', 'grin')
          ])))

    }
  }
});


bot.action('tearsofjoy', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected 😂')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })

  .then(next);
})
bot.action('thumbsup', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected 👍')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })
    .then(next);
})
bot.action('heart', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected ❤')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })
    .then(next);;
})
bot.action('fire', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected 🔥')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })
    .then(next);
})
bot.action('clap', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected 👏')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })
    .then(next);
})
bot.action('grin', (ctx, next) => {
  let data = ctx.update.callback_query.data;

  return ctx.answerCallbackQuery('selected 😀')
    .then(() => {
      user.castVote(ctx, bot.options.username);
    })
    .then(next);
})


bot.catch((err) => {
  winston.log('debug', 'in bot catch error');
  winston.log('error', err);
})

bot.startPolling()
