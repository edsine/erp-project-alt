const db = require('../db');
const path = require('path');
const fs = require('fs');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    // Show all clients to all roles
    const query = `
      SELECT c.*, COUNT(f.id) as file_count 
      FROM clients c
      LEFT JOIN files f ON c.id = f.client_id
      GROUP BY c.id
    `;

    const [clients] = await db.query(query);
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
  
  // Validation
  if (!name || !code) {
    return res.status(400).json({ 
      success: false,
      message: 'Both name and code are required' 
    });
  }

  try {
    // Check for existing name+code combination (your actual requirement)
    const [existing] = await db.query(
      `SELECT id FROM clients WHERE name = ? AND code = ?`, 
      [name.trim(), code.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        errorType: 'DUPLICATE_NAME_CODE',
        message: 'This exact name and code combination already exists'
      });
    }

    // Proceed with creation (allow same code with different names)
    const [result] = await db.query(
      `INSERT INTO clients (name, code) VALUES (?, ?)`,
      [name.trim(), code.trim()]
    );

    return res.status(201).json({ 
      success: true,
      data: { id: result.insertId, name, code }
    });

  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during client creation'
    });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  try {
    // Check if client exists
    const [client] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (client.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Update client
    await db.query('UPDATE clients SET name = ?, code = ? WHERE id = ?', [
      name, 
      code, 
      req.params.id
    ]);

    res.json({ 
      success: true, 
      data: { id: req.params.id, name, code },
      message: 'Client updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update client' });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    // First check if client exists
    const [client] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (client.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check if client has files (optional - you might want to prevent deletion if files exist)
    const [files] = await db.query('SELECT id FROM files WHERE client_id = ? LIMIT 1', [req.params.id]);
    if (files.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete client with existing files' 
      });
    }

    // Delete client
    await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete client' });
  }
};

// Get all files
exports.getAllFiles = async (req, res) => {
  const { client_id } = req.query;
  try {
    // Show all files to all roles for the specified client
    const query = 'SELECT * FROM files WHERE client_id = ?';
    const [files] = await db.query(query, [client_id]);
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

    // Removed permission check - all authenticated users can access
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

// View file (inline in browser)
exports.viewFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Fetch file metadata
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in database' });
    }

    const file = files[0];

    // Permission check
    const isOwner = file.uploaded_by === req.user.id;
    const isPrivileged = ['gmd', 'chairman'].includes(req.user.role);
    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized to access this file' });
    }

    const filePath = path.resolve(file.path);
    const fileName = file.name;
    const fileType = file.type || 'application/octet-stream';

    // File existence check
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Viewable MIME types
    const viewableTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain'
    ];

    const isViewable = viewableTypes.includes(fileType);

    // Headers
    res.setHeader(
      'Content-Disposition',
      `${isViewable ? 'inline' : 'attachment'}; filename="${fileName}"`
    );
    res.setHeader('Content-Type', fileType);

    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end('Error reading file');
    });
  } catch (err) {
    console.error('ViewFile Error:', err);
    res.status(500).json({ success: false, message: 'Failed to serve file' });
  }
};


exports.downloadFile = async (req, res) => {
  const { id } = req.params;
  console.log(`Download request for file ID: ${id}`);

  try {
    // 1. Get file from database
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [id]);
    
    if (files.length === 0) {
      console.log('File not found in database');
      return res.status(404).json({ error: 'File not found in database' });
    }

    const file = files[0];
    console.log('Found file:', file.name);
    
    // 2. Verify file exists (normalize path for Windows)
    const filePath = file.path.replace(/\\/g, '/');
    console.log('Checking file at:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ error: 'File not found on server' });
    }

    // 3. Set proper headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');

    // 4. Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('open', () => {
      console.log('File stream opened, starting download');
      fileStream.pipe(res);
    });

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'File streaming error' });
      }
    });

    req.on('close', () => {
      console.log('Client disconnected, cleaning up');
      fileStream.destroy();
    });

  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};