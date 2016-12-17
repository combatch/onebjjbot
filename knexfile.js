const db = require('./config/config.js')[process.env.NODE_ENV || 'development'];

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: `${db.HOST}`,
      port: `${db.PORT}`,
      database: `${db.DBNAME}`,
      user: `${db.USER}`,
      password: `${db.PASSWORD}`
    },
    migrations: {
      tableName: 'telegram_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: `${db.HOST}`,
      port: `${db.PORT}`,
      database: `${db.DBNAME}`,
      user: `${db.USER}`,
      password: `${db.PASSWORD}`
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'telegram_migrations'
    }
  }

};