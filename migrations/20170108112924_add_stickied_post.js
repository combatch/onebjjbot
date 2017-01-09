exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.table('Votes', function(table) {
      table.boolean('isStickied');
    }),

    knex.schema.raw('ALTER TABLE "public"."Votes" ALTER COLUMN "group_id" TYPE decimal(24);'),
    knex.schema.raw('ALTER TABLE "public"."Users" ALTER COLUMN "group_id" TYPE decimal(24);')


  ])

};

exports.down = function(knex, Promise) {


  return Promise.all([

    knex.schema.table('Votes', function (table) {
      table.dropColumn('isStickied');
    })


  ])

};
