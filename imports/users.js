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
  createUser(ctx) {

    winston.log('debug', ctx.message);
    let userId = ctx.message.from.id;
    let name = ctx.message.from.first_name;
    let group = ctx.chat.type == 'group' ? ctx.chat.id : '';
    winston.log('debug', name, group);

    console.log(Users.getUserbyId(31) );



    // run getUserbyID
    // if exists, return 'already registered'.
    // else , insert to db

  }


  /**
   * Finds user by id.
   * @param {int} id - the id of the user.
   * @return {obj} returns user obj.
   */
  static getUserbyId(id) {
    knex('Users')
      .where('id', id)
      .first()
      .then((data) => {
        winston.log('debug', 'getuser function', data)
        if (_.isEmpty(data)) {
          winston.log('debug', 'empty object in here');
          return false;
        }
      })
      .catch(function(err) {
        winston.log('info', err);
      })

    return true; // not supposed to always returns true....
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
