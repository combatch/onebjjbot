const conf = require("../config/config.js");
let winston = require("winston");
const _ = require("lodash");
const axios = require("axios");
const instagram = require("public-instagram");
const moment = require("moment");

const Telegraf = require("telegraf");
const { Extra, memorySession, reply, Markup, replyOptions } = Telegraf;

/** Class representing Instagram. */

class Instagram {
  constructor() {}

  async insertLoadingGif(ctx) {
    let returnCTX = await ctx.replyWithVideo(`https://i.imgur.com/sWnfVTj.gif`);

    return returnCTX;
  }

  async handleIG(ctx) {
    let query = ctx.match[1].replace(/[?=]/g, " ");
    let symbol = query.substring(0, 1);
    query = query.substring(1);

    if (symbol == "#") {
      return this.hashtagSearch(ctx, query);
    }
    if (symbol == "@") {
      this.userSearch(ctx, query);
    }
  }

  async hashtagSearch(ctx, query) {
    let replyTo = ctx.update.message.message_id;

    let newContext = await this.insertLoadingGif(ctx);
    let gifChatId = newContext.chat.id;
    let gifMessageId = newContext.message_id;

    ctx.replyWithChatAction("upload_photo");

    const info = await instagram.tags.recent(query, 2);
    console.log(info);
    if (info.response) {
      if (info.response.data.status == "fail") {
        await ctx.telegram.deleteMessage(gifChatId, gifMessageId);
        return ctx.replyWithHTML(`${info.response.data.message} <i>${query}</i>`, {
          reply_to_message_id: replyTo
        });
      }
    }

    let filtered = await this.filterTopPhotos(info);
    await ctx.telegram.deleteMessage(gifChatId, gifMessageId);
    return this.displayImage(ctx, filtered[0]);
  }

  async userSearch(ctx, query) {
    let replyTo = ctx.update.message.message_id;

    let newContext = await this.insertLoadingGif(ctx);
    let gifChatId = newContext.chat.id;
    let gifMessageId = newContext.message_id;

    const user = await instagram.users.posts(query, 2);
    console.log(user);

    if (user.response) {
      if (user.response.data.status == "fail") {
        await ctx.telegram.deleteMessage(gifChatId, gifMessageId);
        return ctx.replyWithHTML(`${user.response.data.message} <i>${query}</i> may have a private profile.`, {
          reply_to_message_id: replyTo
        });
      }
    }

    let filtered = await this.filterTopPhotos(user);
    await ctx.telegram.deleteMessage(gifChatId, gifMessageId);
    //return this.displayImage(ctx, filtered[0]);
    // most recent
    return this.displayImage(ctx, user[0]);
  }

  async filterTopPhotos(data) {
    console.log('data in filter', data)
    let top = _.sortBy(data, [o => o.likes.count]).reverse();

    winston.log("debug", top);
    return top;
  }

  async displayImage(ctx, post) {
    let ago = await moment(post.timestamp, "X").fromNow();
    let caption = `${ago} \n${post.likes.count} ❤️\n\n${post.caption} `;
    await ctx.replyWithPhoto(post.image, { caption: caption });
  }
}

module.exports = Instagram;
