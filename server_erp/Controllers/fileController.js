const db = require('../db');
const path = require('path');
const fs = require('fs');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    // For GMD and Chairman, show all clients
    let query = `
      SELECT c.*, COUNT(f.id) as file_count 
      FROM clients c
      LEFT JOIN files f ON c.id = f.client_id
      GROUP BY c.id
    `;

    // For other roles, show only clients they have files for
    if (req.user.role !== 'gmd' && req.user.role !== 'chairman') {
      query = `
        SELECT c.*, COUNT(f.id) as file_count 
        FROM clients c
        LEFT JOIN files f ON c.id = f.client_id
        WHERE f.uploaded_by = ? OR f.id IS NULL
        GROUP BY c.id
      `;
    }

    const [clients] = await db.query(query, req.user.role !== 'gmd' && req.user.role !== 'chairman' ? [req.user.id] : []);
    res.json({ success: true, data: clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch clients' });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const [client] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (client.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, data: client[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch client' });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  try {
    const [result] = await db.query('INSERT INTO clients (name, code) VALUES (?, ?)', [name, code]);
    res.status(201).json({ success: true, data: { id: result.insertId, name, code } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create client' });
  }
};

// Get all files
exports.getAllFiles = async (req, res) => {
  const { client_id } = req.query;
  try {
    let query = 'SELECT * FROM files WHERE client_id = ?';
    const params = [client_id];

    // For GMD and Chairman, show all files
    if (req.user.role !== 'gmd' && req.user.role !== 'chairman') {
      query += ' AND uploaded_by = ?';
      params.push(req.user.id);
    }

    const [files] = await db.query(query, params);
    res.json({ success: true, data: files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check permissions
    if (req.user.role !== 'gmd' && req.user.role !== 'chairman' && files[0].uploaded_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to access this file' });
    }

    res.json({ success: true, data: files[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch file' });
  }
};

// Upload file
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { client_id, name, description, category } = req.body;
  if (!client_id || !name || !category) {
    return res.status(400).json({ success: false, message: 'Client ID, name, and category are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO files (client_id, name, description, category, path, type, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        client_id,
        name,
        description,
        category,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        req.user.id
      ]
    );

    res.status(201).json({ 
      success: true, 
      data: { 
        id: result.insertId,
        name,
        description,
        category,
        path: req.file.path,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    // First check if file exists and user has permission
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (req.user.role !== 'gmd' && req.user.role !== 'chairman' && files[0].uploaded_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this file' });
    }

    // Delete file from filesystem
    fs.unlink(files[0].path, (err) => {
      if (err) console.error('Failed to delete file from filesystem:', err);
    });

    // Delete from database
    await db.query('DELETE FROM files WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
};