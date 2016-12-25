import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import winston from 'winston';

let env = process.env.NODE_ENV || 'development';
let knexfile = path.resolve('knexfile.js');
let knex = require('knex')(require(knexfile)[env]);



/** Class representing Users. */
class Users {

  /**
   * description would be here.
   */
  constructor() {

  }


  /**
   * adds user to Users table.
   * @param {object} ctx - telegraf context object.
   * @return {boolean} true if successful.
   */
  registerUser(ctx) {

    let User = {
      first_name: ctx.message.from.first_name,
      last_name: ctx.message.from.last_name || '',
      telegram_id: ctx.message.from.id,
      group_id: ctx.chat.type != 'private' ? ctx.chat.id : '',
      group_type: ctx.chat.type,
      group_title: ctx.chat.title
    };

    if (ctx.message.chat.type != 'private') {

      knex('Users')
        .where({
          telegram_id: ctx.message.from.id,
          group_id: ctx.chat.id
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
                ctx.replyWithHTML(`<b>${User.first_name}</b> has been registered.`, { reply_to_message_id: ctx.message.message_id })
              })
              .catch(function(err) {
                winston.log('error', 'in the catch', err);
                ctx.reply(`${err} `);
              });
          } else {
            ctx.replyWithHTML(`<b>${User.first_name}</b> is already registered.`, { reply_to_message_id: ctx.message.message_id })
          }

        });

    } else {
      ctx.replyWithHTML(`command not available in private chat.`, { reply_to_message_id: ctx.message.message_id })
    }


  }


  /**
   * Finds user by id.
   * @param {int} id - the id of the user.
   * @return {obj} returns user obj.
   */
  static getUserbyId(id) {
    let promise = new Promise(function(resolve, reject) {
      knex('Users')
        .where('telegram_id', id)
        .first()
        .then((data) => {
          winston.log('debug', 'getuser function', data)
          if (_.isEmpty(data)) {
            winston.log('debug', 'empty object in here');
          }

          return data;
        })
        .catch(function(err) {
          winston.log('error', err);
        })
    })
  }



  /**
   * retrieves the scores for users in the chat group.
   * @param {object} ctx - telegraf context object.
   * @return {array} an array of the usernames and scores.
   */
  getLeaderboard(ctx) {
    // /leaderboard endpoint
    // takes in groupid param
    // generate leaderboard on front-end
    // send as image.



    let group = ctx.chat.id;
    let title = ctx.chat.title;

    if (ctx.message.chat.type != 'private') {

      knex('Users')
        .where({
          group_id: group
        })
        .whereNotNull('points')
        .limit(15)
        .orderBy('points', 'desc')
        .then((data) => {

          let cleanObj = _.map(data, formatObject);
          winston.log('debug', 'data is', cleanObj);

          let text = cleanObj.map((data, index) => {
            let string = '';
            string += `${index + 1} : <i>${data.name}</i> -- ${data.points}`;
            if (index === 0) {
              string += ' 👑';
            }
            return string;
          })
          text = text.join('\n');

          ctx.replyWithHTML(`<b>${title} Leaderboard</b>\n\n${text}`, { disable_notification: true });
        })
        .catch(function(err) {
          winston.log('error', err);
        })
    }
  }

  upvoteUser(ctx, botName, voterId) {

    let id = ctx.update.callback_query.message.reply_to_message.from.id;
    let name = ctx.update.callback_query.message.reply_to_message.from.first_name;
    let chatId = ctx.update.callback_query.message.chat.id;

    let counter = counter || 0;


    winston.log('info', 'attempting to Upvote user');
    knex('Users')
      .where({
        telegram_id: id,
        group_id: chatId
      })
      .increment('points', 1)
      .asCallback((err, rows) => {
        winston.log('debug', counter);
        Increment(counter);
        winston.log('debug', counter);


        if (err) return console.error(err);
        if (rows == 0) {
          if (name.toLowerCase() == botName.toLowerCase()) {
            ctx.editMessageText(`cannot vote for bots`).catch((err) => winston.log('error', err));
          } else {
            ctx.editMessageText(`${name} needs to /register`).catch((err) => winston.log('error', err));
          }

        } else {
          winston.log('info', `${name} has been upvoted in group ${chatId}`);
        }
      })
      .catch(function(err) {
        winston.log('error', err);
      })


  }


  downvoteUser(ctx, botName, voterId) {

    let id = ctx.update.callback_query.message.reply_to_message.from.id;
    let name = ctx.update.callback_query.message.reply_to_message.from.first_name;
    let chatId = ctx.update.callback_query.message.chat.id;


    winston.log('info', 'attempting to Downvote user');
    knex('Users')
      .where({
        telegram_id: id,
        group_id: chatId
      })
      .decrement('points', 1)
      .asCallback((err, rows) => {
        if (err) return console.error(err);
        if (rows == 0) {
          if (name.toLowerCase() == botName.toLowerCase()) {
            ctx.editMessageText(`cannot vote for bots`).catch((err) => winston.log('error', err));
          } else {
            ctx.editMessageText(`${name} needs to /register`).catch((err) => winston.log('error', err));
          }

        } else {
          winston.log('info', `${name} has been downvoted in group ${chatId}`);
        }
      })
      .catch(function(err) {
        winston.log('error', err);
      })


  }


  castVote(voterUserId, messageId, data) {


    winston.log('info', 'attempting to increment vote', data);
    winston.log('debug', 'voter user id ', voterUserId);
    winston.log('debug', 'message id', messageId);


    knex('Votes')
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
              upvoted: true,
              downvoted: false,
              vote: data
            })

        } else {

          return knex('Votes')
            .where({
              telegram_id: voterUserId,
              message_id: messageId
            })
            .update({
              upvoted: true,
              downvoted: false,
              vote: data
            })

        }


      })
      .catch(function(err) {
        winston.log('error', err);
      })

  }

  countVotes(ctx, data) {


    winston.log('info', 'attempting to count votes');


    let messageId = ctx.update.callback_query.message.reply_to_message.message_id;
    winston.log('debug', 'message id is ', messageId);
    winston.log('debug', 'data is', data);


    knex('Votes')
      .where({
        message_id: messageId
      })
      .select('vote')
      .then(function(rows) {
        winston.log('debug', 'rows info', rows);
        // count the rows
        // maybe .countBy
        // or .map
        // get a count of the votes with data, and rebuild menu each time
      })
      .catch(function(err) {
        winston.log('error', err);
      })

    // knex('Votes')
    //   .where({
    //     message_id: messageId,
    //     vote: data
    //   })
    //   .count('vote')
    //   .then(function(rows) {
    //     let count = rows[0].count;
    //     winston.log('debug', 'count is', count);
    //     return count;
    //   })
    //   .catch(function(err) {
    //     winston.log('error', err);
    //   })

  }





}

function formatObject(dirtyObj) {
  let obj = {};
  obj['name'] = dirtyObj.first_name;
  obj['points'] = dirtyObj.points;

  winston.log('debug', 'in formatObject function');
  return obj;
}

function Increment(x) {
  return ++x;
}


export default Users;
