exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.createTable('Users', function(table) {
      table.increments('id').primary();
      table.integer('telegram_id');
      table.string('first_name');
      table.string('last_name');
      table.string('username');
      table.string('role');
      table.string('rank');
      table.string('group_title');
      table.string('group_type');
      table.integer('group_id');
      table.integer('points');
      table.boolean('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('modified_at').defaultTo(knex.fn.now());
    })


  ])

};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema.dropTable('Users')
  ])

};
