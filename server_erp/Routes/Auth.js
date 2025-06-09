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

    db.query(sql, [name, email, hashedPassword, role, department, is_admin || 0], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'User registration failed', details: err });
      }
       res.status(201).json({
        message: 'User registered successfully',
        id: result.insertId
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, is_admin: user.is_admin } });
  });
});

// GET /users - fetch all users
router.get('/users', async (req, res) => {
  const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results);
  });
});

// GET /users/:id - fetch a single user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user by ID:', err);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]); // return single user object
  });
});








///////////////////USER MANAGEMENT ROUTES PLEASE!!!!!

// POST /users - Create a new user
router.post('/users', async (req, res) => {
  const { name, email, password, role, department, is_admin = 0 } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  try {
    // Check for existing email
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (results.length > 0) return res.status(400).json({ message: 'Email already in use' });

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

      db.query('INSERT INTO users SET ?', user, (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: 'Failed to create user', error: insertErr });

        return res.status(201).json({ message: 'User created successfully', user_id: result.insertId });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected error', error: error.message });
  }
});

// GET all users
router.get('/users', (req, res) => {
  const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Error retrieving users' });
    }

    res.status(200).json(results);
  });
});


// GET user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;

  const sql = 'SELECT id, name, email, role, department, is_admin, created_at FROM users WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user by ID:', err);
      return res.status(500).json({ message: 'Error retrieving user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});


module.exports = router;
