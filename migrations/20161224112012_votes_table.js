exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.createTable('Votes', function(table) {
      table.increments('id').primary();
      table.integer('telegram_id');
      table.integer('message_id');
      table.integer('group_id');
      table.string('vote');
      table.boolean('upvoted');
      table.boolean('downvoted');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('modified_at').defaultTo(knex.fn.now());
    })


  ])

};

exports.down = function(knex, Promise) {


  return Promise.all([
    knex.schema.dropTable('Votes')
  ])

};
