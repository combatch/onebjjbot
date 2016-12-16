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
    winston.log('debug', 'in constructor');
  }


  /**
   * adds user to Users table.
   * @param {object} ctx - telegraf context object.
   * @return {boolean} true if successful.
   */
  createUser(ctx){
    winston.log('debug', 'in create user function');
    winston.log('debug', ctx.message);
    let name = ctx.message.from.first_name;
    let group = ctx.chat.type == 'group' ? ctx.chat.id : '' ;
    winston.log('debug', name ,group);

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
