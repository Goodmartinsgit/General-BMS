const { Pool } = require('pg');
require('dotenv').config();

const isRemoteDB = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDB
    ? { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    : false
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
