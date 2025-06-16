const mysql = require('mysql2/promise'); // Add /promise
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test connection with promise syntax
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL DB connected successfully');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

testConnection();

module.exports = db;