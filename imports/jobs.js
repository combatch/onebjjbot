const conf = require("../config/config.js");
const _ = require("lodash");
const axios = require("axios");

const Telegraf = require("telegraf");
const { Extra, memorySession, reply, Markup, replyOptions } = Telegraf;

/** Class representing Job. */

class Job {
  constructor() {}

  async insertLoadingGif(ctx) {
    let returnCTX = await ctx.replyWithVideo(`https://i.imgur.com/sWnfVTj.gif`);

    return returnCTX;
  }

  async createButtons(ctx, bot) {
    // console.log("cache", ctx.session.imageCache);

    let message = await ctx.replyWithPhoto(
      ctx.session.imageCache[0].url,
      Extra.HTML().markup(m => {
        return m.inlineKeyboard([
          m.callbackButton("1", "1"),
          m.callbackButton("2", "2"),
          m.callbackButton("3", "3"),
          m.callbackButton("original", "original")
        ]);
      })
    );

    ctx.session.toDelete = true;

    bot.on("callback_query", ctx => {
      this.modular(ctx);
    });

    ctx.session.unUsed = message.message_id;
    return;
  }

  async modular(ctx) {
    let newContext = await this.insertLoadingGif(ctx);
    let gifChatId = newContext.chat.id;
    let gifMessageId = newContext.message_id;

    if (ctx.session.toDelete) {
      ctx.deleteMessage();
    }

    let data = ctx.update.callback_query.data;
    ctx.answerCallbackQuery(`selected ${data}`);
    ctx.replyWithChatAction("upload_photo");

    await ctx.telegram.deleteMessage(gifChatId, gifMessageId);

    let target = await ctx.replyWithPhoto(
      ctx.session.imageCache[`${data}`].url,
      Extra.HTML().markup(m => {
        return m.inlineKeyboard([
          m.callbackButton("1", "1"),
          m.callbackButton("2", "2"),
          m.callbackButton("3", "3"),
          m.callbackButton("original", "0")
        ]);
      })
    );
    ctx.session.oldImage = target.message_id;
  }
}

module.exports = Job;
