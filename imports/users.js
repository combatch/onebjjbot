import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import winston from 'winston';
import config from '../config/config';

let env = process.env.NODE_ENV || 'development';
let knexfile = path.resolve('knexfile.js');
let knex = require('knex')(require(knexfile)[env]);

const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const bot = new Telegraf(config[`${env}`]['token']);




/** Class representing Users. */
class Users {

  /**
   * description would be here.
   */
  constructor() {

  }


  /**
   * convert old group id to new supergroup one
   * @param {object} ctx - telegraf context object.
   * @return {int} the id .
   */
  updateGroupId(oldID, newID) {


    return knex('Votes')
      .where({
        group_id: oldID
      })
      .update({
        group_id: newID
      })
      .then(function(rows) {


        return knex('Users')
          .where({
            group_id: oldID
          })
          .update({
            group_id: newID
          })
          .then(() => {})

      })
      .catch(function(err) {
        winston.log('error', 'in the catch', err);
        ctx.reply(`${err} `);
      });


  }

  /**
   * get message id of the pinned post
   * @param {object} ctx - telegraf context object.
   * @return {int} the id .
   */
  getStickiedMessageId(ctx) {

    let group = ctx.chat.id;

    return knex('Votes')
      .where({
        group_id: group,
        isStickied: true
      })
      .first('message_id')
      .then(function(rows) {

        if (!_.isEmpty(rows)) {
          let messageId = rows['message_id'];
          return messageId;
        }

      })
  }



  /**
   * adds user to Users table.
   * @param {object} ctx - telegraf context object.
   * @return {boolean} true if successful.
   */
  registerUser(ctx, auto) {
    let chatType, telegram_id, group_id, message_id, User;

    if (auto) {

      chatType = ctx.update.callback_query.message.chat.type;
      telegram_id = ctx.update.callback_query.message.from.id;
      group_id = ctx.update.callback_query.message.chat.type != 'private' ? ctx.update.callback_query.message.chat.id : '';
      message_id = ctx.update.callback_query.message.reply_to_message.message_id;

      User = {
        first_name: ctx.update.callback_query.message.from.first_name,
        last_name: ctx.update.callback_query.message.from.last_name || '',
        telegram_id: telegram_id,
        group_id: group_id,
        group_type: ctx.update.callback_query.message.chat.type,
        group_title: ctx.update.callback_query.message.chat.title
      };


    } else {
      chatType = ctx.message.chat.type;
      telegram_id = ctx.message.from.id;
      group_id = ctx.chat.type != 'private' ? ctx.chat.id : '';
      message_id = ctx.message.message_id;

      User = {
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name || '',
        telegram_id: telegram_id,
        group_id: group_id,
        group_type: ctx.chat.type,
        group_title: ctx.chat.title
      };

    }


    if (chatType != 'private') {

      return knex('Users')
        .where({
          telegram_id: telegram_id,
          group_id: group_id
        })
        .asCallback((err, rows) => {
          if (err) return console.error(err);
          if (_.isEmpty(rows)) {
            knex.transaction(function(t) {
                return knex('Users')
                  .transacting(t)
                  .insert({
                    first_name: User.first_name,
                    last_name: User.last_name,
                    telegram_id: User.telegram_id,
                    points: 0,
                    group_id: User.group_id,
                    group_type: User.group_type,
                    group_title: User.group_title
                  })
                  .then(t.commit)
                  .catch(function(err) {
                    t.rollback();
                    winston.log('error', 'in first transaction catch ', err);
                    ctx.reply(`${err} `);
                    throw err;
                  })
              })
              .then(function() {
                return ctx.replyWithHTML(`<b>${User.first_name}</b> has been registered.`, { reply_to_message_id: message_id })
              })
              .catch(function(err) {
                winston.log('error', 'in the catch', err);
                ctx.reply(`${err} `);
              });
          } else {
            return ctx.replyWithHTML(`<b>${User.first_name}</b> is already registered.`, { reply_to_message_id: message_id })
          }

        });

    } else {
      return ctx.replyWithHTML(`command not available in private chat.`, { reply_to_message_id: message_id })
    }


  }


  /**
   * retrieves the scores for users in the chat group.
   * @param {object} ctx - telegraf context object.
   * @return {array} an array of the usernames and scores.
   */
  getLeaderboard(ctx, messageId) {
    // send as image later.

    let group = ctx.chat.id;
    let title = ctx.chat.title;

    if (ctx.message.chat.type != 'private') {

      return knex('Users')
        .where({
          group_id: group
        })
        .whereNotNull('points')
        .limit(15)
        .orderBy('points', 'desc')
        .then((data) => {
          let text = buildLeaderboardHTML(data);
          let latestDate = Date.now();


          if (messageId) {
            ctx.replyWithHTML(`updated leaderboard`, { reply_to_message_id: messageId });
            return ctx.telegram.editMessageText(group, messageId, '', `<b>${title} Leaderboard</b>\n\n${text} \n\n Last Update: ${latestDate}`, { disable_notification: true, parse_mode: 'html' })
              .catch((err) => {
                winston.log('error', err);
                ctx.replyWithHTML(`${err}`);
              })
          } else {
            return ctx.replyWithHTML(`<b>${title} Leaderboard</b>\n\n${text}`, { disable_notification: true });
          }

        })
        .catch(function(err) {
          winston.log('error', err);
        })
    }
  }

  /**
   * upon pinning a post, save that message_id to database.
   * @param {object} ctx - telegraf context object.
   * @return {bool}
   */
  saveStickyId(ctx) {
    let group = ctx.chat.id;
    let stickiedPostId = ctx.update.message.pinned_message.message_id;

    return knex('Votes')
      .insert({
        group_id: group,
        message_id: stickiedPostId,
        isStickied: true
      })
      .then(() => {
        return true;
      })
      .catch(function(err) {
        winston.log('error', err);
        return false;
      })

  }


  /**
   * update message_id to latest pinned message.
   * @param {object} ctx - telegraf context object.
   * @return {bool}
   */
  updateStickyId(ctx) {

    let group = ctx.chat.id;
    let stickiedPostId = ctx.update.message.pinned_message.message_id;

    return knex('Votes')
      .where({
        group_id: group,
        isStickied: true
      })
      .update({
        group_id: group,
        message_id: stickiedPostId,
        isStickied: true
      })
      .then(() => {
        return true;
      })
      .catch(function(err) {
        winston.log('error', err);
        return false;
      })

  }

  /**
   * see if a pinned message exists for group.
   * @param {object} ctx - telegraf context object.
   * @return {bool}
   */
  checkStickyId(ctx) {
    let group = ctx.chat.id;

    return knex('Votes')
      .where({
        group_id: group,
        isStickied: true
      })
      .then((rows) => {
        if (!_.isEmpty(rows)) {
          return true;
        }
        return false;

      })
      .catch(function(err) {
        winston.log('error', err);
        return false;
      })

  }


  /**
   * get user who is upvoted the most
   * get the most upvoted post
   * most used emoji breakdown
   * voter who votes the most
   * get all time, past 7 days, & past month in one message.
   *
   * @param {object} ctx - telegraf context object.
   * @return {object}
   */
  retrieveStats(ctx) {
    let group = ctx.chat.id;


    return knex('Votes')
      .where({
        group_id: group,
        isStickied: true
      })
      .then((rows) => {
        if (!_.isEmpty(rows)) {
          return true;
        }
        return false;

      })
      .catch(function(err) {
        winston.log('error', err);
        return false;
      })

  }


  /**
   * get the post with highest count of voters
   * @param {object} ctx - telegraf context object.
   * @return {int} the message id.
   */
  getMostUpvotedPost(ctx) {

    let group = ctx.chat.id;

    return knex.raw(`
        SELECT DISTINCT
          COUNT (
            "public"."Votes".message_id
          ) AS message,
          "public"."Votes".group_id,
          "public"."Votes".message_id
        FROM
          "public"."Votes"
        WHERE
          "public"."Votes".group_id = - 1001098497476
        GROUP BY
          "public"."Votes".message_id,
          "public"."Votes".group_id,
          "public"."Votes".message_id
        ORDER BY
          message DESC
        `)
      .then(function(rows) {
        winston.log('debug', 'asdf', rows);

        if (!_.isEmpty(rows)) {
          let messageId = rows['message_id'];



          return ctx.replyWithHTML(`most upvoted post `, { reply_to_message_id: messageId });

        }

        let messageId = 473;

        return ctx.replyWithHTML(`most upvoted post `, { reply_to_message_id: messageId });

      })
  }








  castVote(ctx, botName) {

    let voter = ctx.update.callback_query.from.first_name;
    let voterUserId = ctx.update.callback_query.from.id;
    let messageId = ctx.update.callback_query.message.reply_to_message.message_id;
    let data = ctx.update.callback_query.data;

    let id = ctx.update.callback_query.message.reply_to_message.from.id;
    let chatId = ctx.update.callback_query.message.chat.id;
    let name = ctx.update.callback_query.message.reply_to_message.from.first_name;

    return knex('Votes')
      .where({
        telegram_id: voterUserId,
        message_id: messageId
      })
      .then(function(rows) {

        if (rows == 0) {

          return knex('Votes')
            .insert({
              telegram_id: voterUserId,
              message_id: messageId,
              canIncrement: true,
              group_id: chatId,
              name: name,
              voter: voter,
              vote: data
            })

        } else {

          return knex('Votes')
            .where({
              telegram_id: voterUserId,
              message_id: messageId
            })
            .update({
              canIncrement: false,
              vote: data
            })
        }

      })
      .then(() => {
        return this.countVotes(ctx, data);
      })
      .then(() => {

        return knex('Votes')
          .where({
            telegram_id: voterUserId,
            message_id: messageId,
            canIncrement: true
          })
          .then((rows) => {

            let Countobj = _.countBy(rows);
            if (_.isEmpty(Countobj)) {
              winston.log('info', `${voterUserId} changed their vote to ${data}`);
            } else {

              return knex('Users')
                .where({
                  telegram_id: id,
                  group_id: chatId
                })
                .increment('points', 1)
                .asCallback((err, rows) => {

                  if (err) return console.error(err);
                  if (rows == 0) {

                    if (name.toLowerCase() == botName.toLowerCase()) {
                      return ctx.editMessageText(`cannot vote for bots`).catch((err) => winston.log('error', err));
                    } else {

                      // auto register user
                      winston.log('debug', 'here', ctx.update);

                      return this.registerUser(ctx, true);
                      // return ctx.editMessageText(`${name} needs to /register`).catch((err) => winston.log('error', err));

                    }
                  } else {
                    winston.log('info', `${name} has been upvoted in group ${chatId}`);
                  }
                })
                .catch(function(err) {
                  winston.log('error', err);
                })

            }

          })

      })
      .catch(function(err) {
        winston.log('error', err);
      })

  }




  countVotes(ctx, data) {

    winston.log('info', 'attempting to count votes');
    let messageId = ctx.update.callback_query.message.reply_to_message.message_id;
    winston.log('info', 'data is', data);

    knex('Votes')
      .where({
        message_id: messageId
      })
      .select('vote')
      .then(function(rows) {
        let Countobj = _.countBy(rows, 'vote');
        rebuildMenuButtons(ctx, Countobj);
      })
      .catch(function(err) {
        winston.log('error', err);
      })

  }


  updateLeaderboard(ctx, group, title) {

    let p = Promise
      .resolve(this.getStickiedMessageId(ctx))
      .then((messageId) => {

        return knex('Users')
          .where({
            group_id: group
          })
          .whereNotNull('points')
          .limit(15)
          .orderBy('points', 'desc')
          .then((data) => {
            let text = buildLeaderboardHTML(data);
            let latestDate = Date.now();

            return ctx.telegram.editMessageText(group, messageId, '', `<b>${title} Leaderboard</b>\n\n${text} \n\n Last Update: ${latestDate}`, { disable_notification: true, parse_mode: 'html' })
              .catch((err) => {
                winston.log('error', err);
                ctx.replyWithHTML(`${err}`);
              })

          })
          .catch(function(err) {
            winston.log('error', err);
          })

      })
      .catch(function(err) {
        winston.log('error', err);
      })


  }





}

function rebuildMenuButtons(ctx, countObj) {

  let originalMessageId = ctx.update.callback_query.message.reply_to_message.message_id;
  let latestDate = ctx.update.callback_query.message.edit_date || Date.now();

  return ctx.editMessageText(`<i>choose a button to upvote</i> (last updated: ${latestDate})`, Extra
    .inReplyTo(originalMessageId)
    .notifications(false)
    .HTML()
    .markup(
      Markup.inlineKeyboard([
        Markup.callbackButton(`${countObj.tearsofjoy || ''} 😂`, 'tearsofjoy'),
        Markup.callbackButton(`${countObj.thumbsup || ''} 👍`, 'thumbsup'),
        Markup.callbackButton(`${countObj.heart || ''} ❤`, 'heart'),
        Markup.callbackButton(`${countObj.fire || ''} 🔥`, 'fire'),
        Markup.callbackButton(`${countObj.clap || ''} 👏`, 'clap'),
        Markup.callbackButton(`${countObj.grin || ''} 😀`, 'grin')
      ])));

}


function buildLeaderboardHTML(data) {
  let cleanObj = _.map(data, formatObject);

  let text = cleanObj.map((data, index) => {
    let string = '';
    string += `${index + 1} : <i>${data.name}</i> -- ${data.points}`;
    if (index === 0) {
      string += ' 👑';
    }
    return string;
  })
  text = text.join('\n');

  return text;
}



function formatObject(dirtyObj) {
  let obj = {};
  obj['name'] = dirtyObj.first_name;
  obj['points'] = dirtyObj.points;

  return obj;
}




export default Users;
