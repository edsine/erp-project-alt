const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


db.getConnection((err,connection)=>{
      if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('✅ MySQL DB connected successfully');
    connection.release(); // release connection back to pool
  }
})
module.exports = db;
// db.js