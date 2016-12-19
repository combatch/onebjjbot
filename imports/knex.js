import path from 'path';
import winston from 'winston';
let env = process.env.NODE_ENV || 'development';
let knexfile = path.resolve('knexfile.js');
let knex = require('knex')(require(knexfile)[env]);


/** Class representing knex migrations. */
class Migrations {

  /**
   * description would be here.
   */
  constructor() {

  }


  /**
   * runs migrations
   * @param {object} ctx - telegraf context object.
   */
  migrateLatest(ctx, next) {
    knex.migrate.latest()
      .then(function() {
        winston.log('info', 'ran migrations from index.js. DB should be up to date.');
      })
      .then(next)
      .catch(function(err) {
        winston.log('info', err);
      })

  }

}
export default Migrations;
