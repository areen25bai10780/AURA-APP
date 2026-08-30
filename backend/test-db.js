const pool = require('./db');

async function testConnection() {
  console.log('Attempting to connect to the database...');
  try {
    // Run a simple test query to verify we can talk to the database
    const res = await pool.query('SELECT NOW()');
    console.log('----------------------------------------------------');
    console.log('✅ Connection successful!');
    console.log('Database server time:', res.rows[0].now);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('----------------------------------------------------');
    console.error('❌ Database connection failed!');
    console.error('Error Details:', err.message);
    console.error('----------------------------------------------------');
  } finally {
    // Close the pool so the test process finishes and exits
    await pool.end();
  }
}

testConnection();
