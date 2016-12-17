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
      group_id: ctx.chat.type == 'group' ? ctx.chat.id : ''
    };

    knex.transaction(function(t) {
        return knex('Users')
          .transacting(t)
          .insert({
            first_name: User.first_name,
            last_name: User.last_name,
            telegram_id: User.telegram_id,
            group_id: User.group_id
          })
          .then(t.commit)
          .catch(function(err) {
            t.rollback();

            winston.log('info', 'already exists', err);
            ctx.reply(`${User.first_name} is already registered.`);
            throw err;
          })
      })
      .then(function(test) {
        ctx.reply(`${User.first_name} has been registered.`);
      })
      .catch(function(err) {
        winston.log('info', 'in the catch', err);
      });

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
          winston.log('info', err);
        })
    })
  }



  /**
   * retrieves the scores for users in the chat group.
   * @param {object} ctx - telegraf context object.
   * @return {array} an array of the usernames and scores.
   */
  getLeaderboard(ctx) {


  }


}


export default Users;
