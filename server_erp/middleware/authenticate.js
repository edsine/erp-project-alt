require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authentication required');
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      throw new Error('Invalid token');
    }


    if (users.length === 0) {
      throw new Error('User not found');
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || 'Not authenticated' });
  }
};
