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
    const token = req.query.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch file metadata
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', file.type);
    
    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error('ViewFile Error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(500).json({ success: false, message: 'Failed to serve file' });
  }
};


exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in database' });
    }

    const file = files[0];
    const filePath = path.resolve(file.path);
    const safeFileName = path.basename(file.name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // No role or ownership checks here
    res.download(filePath, safeFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).end('Error downloading file');
      }
    });
  } catch (err) {
    console.error('DownloadFile Error:', err);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};

exports.uploadMultipleFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const { client_id, category, uploaded_by } = req.body;
  if (!client_id || !category) {
    return res.status(400).json({ success: false, message: 'Client ID and category are required' });
  }

  try {
    // Process each file
    const uploadPromises = req.files.map(async (file, index) => {
      const name = req.body.names?.[index] || file.originalname;
      const description = req.body.descriptions?.[index] || '';

      const [result] = await db.query(
        'INSERT INTO files (client_id, name, description, category, path, type, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          client_id,
          name,
          description,
          category,
          file.path,
          file.mimetype,
          file.size,
          uploaded_by
        ]
      );

      return {
        id: result.insertId,
        name,
        description,
        category,
        path: file.path,
        type: file.mimetype,
        size: file.size
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(201).json({ 
      success: true, 
      data: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to upload files' });
  }
};
// Delete multiple files
exports.deleteMultipleFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;

    // Validate input
    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file IDs provided' 
      });
    }

    // First get all files to delete with their metadata
    const [filesToDelete] = await db.query(
      'SELECT * FROM files WHERE id IN (?)', 
      [fileIds]
    );

    // Check if all files exist
    if (filesToDelete.length !== fileIds.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Some files not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'gmd' && req.user.role !== 'chairman') {
      const unauthorizedFiles = filesToDelete.filter(
        file => file.uploaded_by !== req.user.id
      );
      if (unauthorizedFiles.length > 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized to delete some files' 
        });
      }
    }

    // Delete files from filesystem
    filesToDelete.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file ${file.path}:`, err);
      });
    });

    // Delete from database
    await db.query('DELETE FROM files WHERE id IN (?)', [fileIds]);

    res.json({ 
      success: true, 
      message: `${fileIds.length} file(s) deleted successfully` 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete files' 
    });
  }
};