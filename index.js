import config from './config/config';
import winston from './middleware/winston';
import Complex from './middleware/complexMiddleWare';
import Stocks from './middleware/stockMiddleware';
import Knex from './imports/knex';
import ScreenShots from './imports/screenshots';
import Users from './imports/users';
import Vote from './imports/vote';
import Google from './imports/google';
import Bitcoin from './imports/bitcoin';
import Files from './imports/fileStreams';
import Dictionary from './imports/dictionary';
import _ from 'lodash';

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
const bitcoin = new Bitcoin();
const file = new Files();
const dictionary = new Dictionary();


migrations.migrateLatest();


// middlewares
bot.use(Telegraf.memorySession());

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
})





bot.hears(/\/balance ([13][a-km-zA-HJ-NP-Z0-9]{26,33}$)/, (ctx) => {
  return bitcoin.getBalance(ctx);
});

bot.command('coinbase', (ctx) => {
  return bitcoin.getCoinbaseExchangeRate(ctx);
});


bot.hears(/\/convert (.+)(.[a-z]{3})( to)(.[a-z]{3})/i, (ctx) => {
  return bitcoin.convertToBitcoin(ctx);
});
bot.hears(/\/btc/i, (ctx) => {
  return bitcoin.getBitcoinityChart(ctx);
});

bot.hears(/\gif (.+)/i, (ctx) => {
  return google.getGifs(ctx);
});

bot.hears(/\youtube (.+)/i, (ctx) => {
  return google.searchYoutube(ctx);
});

bot.hears(/\img (.+)/i, (ctx) => {
  return google.imgSearch(ctx);
});

bot.hears(/giphy (.+)/i, (ctx) => {
  return google.tenorSearch(ctx);
});

bot.hears(/\/ud (.+)/i, (ctx) => {
  return dictionary.urbanDictionary(ctx);
});

bot.hears(/\/define (.+)/i, (ctx) => {
  return dictionary.pearsonDictionary(ctx);
});


bot.hears(/translate (.+)/i, (ctx) => {

  if (ctx.message.reply_to_message) {
    google.translate(ctx);
  } else {
    return ctx.reply('usage: reply to a message with "translate <foreignlanguage>"');
  }

});

bot.hears(/stocks (.{1,5})/i, stocksMiddleware.getStocks, (ctx) => {
  winston.log('debug', 'symbol: ' + ctx.match[1]);
});

bot.hears(/\/ss (.+)/, (ctx) => {
  const ss = new ScreenShots();
  return ss.createScreenshot(ctx, '');
});

bot.command('register', (ctx) => {
  return user.registerUser(ctx);
});

bot.command('stats', (ctx) => {
  return user.getMostUpvotedPost(ctx);
});

bot.on('pinned_message', (ctx) => {
  let p = Promise.resolve(user.checkStickyId(ctx));
  p.then((exists) => {
    if (exists) {
      return user.updateStickyId(ctx);
    } else {
      return user.saveStickyId(ctx);
    }
  });
});

bot.on('migrate_from_chat_id', (ctx) => {
  let oldID = ctx.update.message.migrate_from_chat_id;
  let newID = ctx.update.message.chat.id;

  let p = Promise.resolve(user.updateGroupId(oldID, newID));
  p.then((exists) => {
    ctx.reply(`converted to supergroup successfully.`);
  });
});


bot.on(['video', 'document'], (ctx) => {
  return file.convertToMp4(ctx);
});

bot.command('leaderboard', (ctx) => {

  let p = Promise.resolve(user.getStickiedMessageId(ctx));
  p.then((messageId) => {
    if (_.isUndefined(messageId)) {
      winston.log('info', 'no pinned message, posting leaderboard');
      return user.getLeaderboard(ctx);
    } else {
      return user.getLeaderboard(ctx, messageId);
    }
  });
});




// if replying with emoji, auto increment
bot.on('message', (ctx) => {


  let lul = "lul";
  let lulRegEx = new RegExp(lul, "ig");
  let lol = "l+o+l.*";
  let lolRegEx = new RegExp(lol, "ig");
  let upvote = "upvote";
  let upvoteRegEx = new RegExp(upvote, "ig");
  let lmao = "l+m+a+o+";
  let lmaoRegEx = new RegExp(lmao, "ig");
  let haha = "h+a+h+";
  let hahaRegEx = new RegExp(haha, "ig");

  if (ctx.message.reply_to_message) {

    if (lolRegEx.test(ctx.message.text) || lulRegEx.test(ctx.message.text) || upvoteRegEx.test(ctx.message.text) || lmaoRegEx.test(ctx.message.text) ||hahaRegEx.test(ctx.message.text) || ctx.message.text == 'haha' || ctx.message.text == '😂') {

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
            // Markup.callbackButton('👏', 'clap'),
            Markup.callbackButton('💯', 'hundred')
          ])))

    }
  }
});


bot.action('tearsofjoy', (ctx, next) => {
  let data = ctx.update.callback_query.data;
  let group = ctx.update.callback_query.message.chat.id;
  let title = ctx.update.callback_query.message.chat.title;

  return ctx.answerCallbackQuery('selected 😂')
    .then(() => {
      return user.castVote(ctx, bot.options.username);
    })
    .then(() => {
      let p = Promise.resolve(user.getStickiedMessageId(ctx));
      p.then((messageId) => {
        if (!_.isUndefined(messageId)) {
          return user.updateLeaderboard(ctx, group, title);
        }
      })
    })
    .then(next);
});
bot.action('thumbsup', (ctx, next) => {
  let data = ctx.update.callback_query.data;
  let group = ctx.update.callback_query.message.chat.id;
  let title = ctx.update.callback_query.message.chat.title;

  return ctx.answerCallbackQuery('selected 👍')
    .then(() => {
      return user.castVote(ctx, bot.options.username);
    })
    .then(() => {
      let p = Promise.resolve(user.getStickiedMessageId(ctx));
      p.then((messageId) => {
        if (!_.isUndefined(messageId)) {
          return user.updateLeaderboard(ctx, group, title);
        }
      })
    })
    .then(next);
});
bot.action('heart', (ctx, next) => {
  let data = ctx.update.callback_query.data;
  let group = ctx.update.callback_query.message.chat.id;
  let title = ctx.update.callback_query.message.chat.title;

  return ctx.answerCallbackQuery('selected ❤')
    .then(() => {
      return user.castVote(ctx, bot.options.username);
    })
    .then(() => {
      let p = Promise.resolve(user.getStickiedMessageId(ctx));
      p.then((messageId) => {
        if (!_.isUndefined(messageId)) {
          return user.updateLeaderboard(ctx, group, title);
        }
      })
    })
    .then(next);;
});
bot.action('fire', (ctx, next) => {
  let data = ctx.update.callback_query.data;
  let group = ctx.update.callback_query.message.chat.id;
  let title = ctx.update.callback_query.message.chat.title;

  return ctx.answerCallbackQuery('selected 🔥')
    .then(() => {
      return user.castVote(ctx, bot.options.username);
    })
    .then(() => {
      let p = Promise.resolve(user.getStickiedMessageId(ctx));
      p.then((messageId) => {
        if (!_.isUndefined(messageId)) {
          return user.updateLeaderboard(ctx, group, title);
        }
      })
    })
    .then(next);
});
// bot.action('clap', (ctx, next) => {
//   let data = ctx.update.callback_query.data;
//   let group = ctx.update.callback_query.message.chat.id;
//   let title = ctx.update.callback_query.message.chat.title;

//   return ctx.answerCallbackQuery('selected 👏')
//     .then(() => {
//       return user.castVote(ctx, bot.options.username);
//     })
//     .then(() => {
//       let p = Promise.resolve(user.getStickiedMessageId(ctx));
//       p.then((messageId) => {
//         if (!_.isUndefined(messageId)) {
//           return user.updateLeaderboard(ctx, group, title);
//         }
//       })
//     })
//     .then(next);
// });
bot.action('hundred', (ctx, next) => {
  let data = ctx.update.callback_query.data;
  let group = ctx.update.callback_query.message.chat.id;
  let title = ctx.update.callback_query.message.chat.title;

  return ctx.answerCallbackQuery('selected 💯')
    .then(() => {
      return user.castVote(ctx, bot.options.username);
    })
    .then(() => {
      let p = Promise.resolve(user.getStickiedMessageId(ctx));
      p.then((messageId) => {
        if (!_.isUndefined(messageId)) {
          return user.updateLeaderboard(ctx, group, title);
        }
      })
    })
    .then(next);
});





bot.catch((err) => {
  winston.log('debug', 'in bot catch error');
  winston.log('error', err);
})

bot.startPolling()
