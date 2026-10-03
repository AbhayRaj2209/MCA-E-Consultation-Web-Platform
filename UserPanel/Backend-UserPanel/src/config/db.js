// PostgreSQL (Neon) connection pool
const { Pool, types } = require('pg');

// DATE columns as 'YYYY-MM-DD' strings; default Date objects shift a day across time zones
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
