exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.table('Votes', function(table) {
      table.string('voter');
    })

  ])

};

exports.down = function(knex, Promise) {


  return Promise.all([

    knex.schema.table('Votes', function(table) {
      table.dropColumn('voter');
    })


  ])

};
