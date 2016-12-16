exports.up = function(knex, Promise) {

  return Promise.all([

    knex.schema.raw(`
        CREATE TABLE "Users" (
            "id" int PRIMARY KEY,
            "first_name" varchar(255),
            "last_name" varchar(255),
            "username" varchar(255),
            "role" varchar(255),
            "rank" varchar(255),
            "points" int
        );
        CREATE TABLE "Groups" (
            "id" int PRIMARY KEY,
            "title" varchar(255),
            "type" varchar(255),
            "user_id" int,
            FOREIGN KEY("user_id") REFERENCES "Users" ("id")
        );
        `)

  ])

};

exports.down = function(knex, Promise) {

  return Promise.all([
    knex.schema.dropTable('Groups'),
    knex.schema.dropTable('Users')
  ])

};
