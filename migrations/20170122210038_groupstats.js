exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.table('Votes', function(table) {
      table.string('name');
    }),




  ])

};

exports.down = function(knex, Promise) {


  return Promise.all([

    knex.schema.table('Votes', function(table) {
      table.dropColumn('name');
    })


  ])

};
