const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const authenticate = require('../middleware/authenticate');

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF, DOC, XLS, and image files are allowed!');
    }
  }
});

// Create a new project
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, client, description, start_date, end_date } = req.body;
    const created_by = req.user.id;

    const [result] = await db.query(
      'INSERT INTO projects (name, client, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, client, description, start_date, end_date, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      projectId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

// Get all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const [projects] = await db.query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id) AS document_count
      FROM projects p
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

// Get a single project with documents
router.get('/:id', authenticate, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Get project details
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get project documents
    const [documents] = await db.query(`
      SELECT d.*, u.first_name, u.last_name 
      FROM project_documents d
      JOIN users u ON d.uploaded_by = u.id
      WHERE d.project_id = ?
      ORDER BY d.uploaded_at DESC
    `, [projectId]);

    res.json({ 
      success: true, 
      data: {
        ...projects[0],
        documents
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Upload document to project
router.post('/documents', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { project_id, name, type } = req.body;
    const uploaded_by = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const [result] = await db.query(
      'INSERT INTO project_documents (project_id, name, type, path, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [project_id, name, type, req.file.path, uploaded_by]
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      documentId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

// Delete a document
router.delete('/documents/:id', authenticate, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;

    // First get document info to check permissions
    const [documents] = await db.query('SELECT * FROM project_documents WHERE id = ?', [documentId]);
    
    if (documents.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const document = documents[0];

    // Only allow deletion by admin or the uploader
    if (req.user.role !== 'admin' && document.uploaded_by !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    // Delete from database
    await db.query('DELETE FROM project_documents WHERE id = ?', [documentId]);

    // TODO: Also delete the actual file from the server
    // fs.unlinkSync(document.path);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

module.exports = router;