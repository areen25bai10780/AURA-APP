const { Pool } = require('pg');
require('dotenv').config();

// Initialize a connection pool.
// A connection pool manages multiple database connections, allowing our backend
// to handle multiple queries simultaneously without opening/closing connections repeatedly.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required for SSL connections to Supabase (and other cloud databases)
    rejectUnauthorized: false
  }
});

module.exports = pool;
