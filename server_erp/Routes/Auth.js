const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
  const { name, email, password, role, department, is_admin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (name, email, password, role, department, is_admin)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(sql, [name, email, hashedPassword, role, department, is_admin || 0]);
    
    res.status(201).json({
      message: 'User registered successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'User registration failed', details: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [results] = await db.query(sql, [email]);
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role, 
        is_admin: user.is_admin 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});
    
// GET /users - fetch all users
router.get('/users', async (req, res) => {
  try {
    const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users';
    const [results] = await db.query(sql);
    
    res.json(results);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id - fetch a single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users WHERE id = ?';

    const [results] = await db.query(sql, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]); // return single user object
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create a new user
router.post('/users', async (req, res) => {
  const { name, email, password, role, department, is_admin = 0 } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  try {
    // Check for existing email
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      name,
      email,
      password: hashedPassword,
      role,
      department,
      is_admin,
    };

    const [result] = await db.query('INSERT INTO users SET ?', user);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// POST /users - Create or update a user
router.put('/users', async (req, res) => {
  const {
    id,
    name,
    email,
    password,
    role,
    department,
    is_admin = 0,
  } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    // If ID is provided, update the existing user
    if (id) {
      const updates = { name, email, role, department, is_admin };
      
      // If password is provided, hash and include it
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      await db.query('UPDATE users SET ? WHERE id = ?', [updates, id]);

      return res.status(200).json({ message: 'User updated successfully', user_id: id });
    }

    // Otherwise, create a new user
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      department,
      is_admin,
    };

    const [result] = await db.query('INSERT INTO users SET ?', newUser);

    res.status(201).json({
      message: 'User created successfully',
      user_id: result.insertId,
    });
  } catch (error) {
    console.error('❌ Error saving user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change Password Route
router.put('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'User ID, current password, and new password are required' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'New password must be at least 6 characters long'
    });
  }

  try {
    // Fetch user from database
    const sql = `SELECT id, password FROM users WHERE id = ?`;
    const [results] = await db.query(sql, [userId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updateSql = `UPDATE users SET password = ? WHERE id = ?`;
    const [updateResult] = await db.query(updateSql, [hashedNewPassword, userId]);

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ 
      message: 'Password updated successfully' 
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ 
      error: 'Failed to change password', 
      details: err.message 
    });
  }
});

// DELETE /users/:id - Delete a user by ID
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router;