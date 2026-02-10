const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db'); // your mysql connection

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tasks';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

router.post('/tasks', upload.single('file'), async (req, res) => {
  const { title, description, dueDate, priority = 'medium', status = 'pending', assignedTo, createdBy } = req.body;

  if (!title || !createdBy) {
    return res.status(400).json({ message: 'Title and createdBy are required.' });
  }

  const validPriorities = ['low', 'medium', 'high'];
  const validStatuses = ['pending', 'in progress', 'completed'];

  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ message: 'Invalid priority value.' });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const task = {
    title,
    description: description || null,
    due_date: dueDate || null,
    priority,
    status,
    created_by: createdBy,
    assigned_to: assignedTo || null,
    report_requested: false,
  };

  // Add file attachment info if file was uploaded
  if (req.file) {
    task.attachment = req.file.filename;
    task.attachment_original_name = req.file.originalname;
    task.attachment_path = req.file.path;
  }

  try {
    let checkQuery;
    let checkParams;

    if (assignedTo) {
      checkQuery = `
        SELECT id FROM tasks 
        WHERE title = ? AND assigned_to = ? AND created_by = ?
      `;
      checkParams = [title, assignedTo, createdBy];
    } else {
      checkQuery = `
        SELECT id FROM tasks 
        WHERE title = ? AND assigned_to IS NULL AND created_by = ?
      `;
      checkParams = [title, createdBy];
    }

    const [checkResults] = await db.query(checkQuery, checkParams);
    
    if (checkResults.length > 0) {
      return res.status(409).json({ message: 'A task with the same title and assignment already exists.' });
    }

    const insertQuery = 'INSERT INTO tasks SET ?';
    const [result] = await db.query(insertQuery, task);
    
    res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        t.created_by,
        creator.name AS created_by_name,
        t.assigned_to,
        assignee.name AS assigned_to_name,
        t.attachment,
        t.attachment_original_name,
        t.attachment_path,
        t.report_requested
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      ORDER BY t.created_at DESC
    `;

    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Failed to fetch tasks', error: err.message });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        t.created_by,
        creator.name AS created_by_name,
        t.assigned_to,
        assignee.name AS assigned_to_name,
        t.attachment,
        t.attachment_original_name,
        t.attachment_path,
        t.report_requested
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;

    const [results] = await db.query(query, [taskId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ message: 'Failed to fetch task', error: err.message });
  }
});

router.get('/tasks/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Step 1: Get the user's role
    const getUserRoleQuery = 'SELECT role FROM users WHERE id = ? LIMIT 1';
    const [roleResult] = await db.query(getUserRoleQuery, [userId]);

    if (roleResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userRole = roleResult[0].role;
    const elevatedRoles = ['gmd', 'manager', 'chairman'];

    let taskQuery;
    let params;

    // Step 2: Determine which tasks to fetch
    if (elevatedRoles.includes(userRole.toLowerCase())) {
      taskQuery = 'SELECT * FROM tasks ORDER BY created_at DESC';
      params = [];
    } else {
      taskQuery = `
        SELECT * FROM tasks 
        WHERE created_by = ? OR assigned_to = ?
        ORDER BY created_at DESC
      `;
      params = [userId, userId];
    }

    // Step 3: Fetch tasks
    const [taskResults] = await db.query(taskQuery, params);
    res.json({ tasks: taskResults });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

//count tasks for users
router.get('/tasks/counts/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get user info including role and department
    const [userRows] = await db.query(`
      SELECT id, role, department 
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    const role = user.role.toLowerCase();
    const department = user.department;

    // Define role categories
    const globalRoles = ['gmd', 'chairman'];
    const departmentRoles = ['manager', 'executive'];
    const regularRoles = ['staff', 'hr', 'finance'];

    let query = '';
    let params = [];

    if (globalRoles.includes(role)) {
      // Global roles see all tasks
      query = 'SELECT COUNT(*) AS count FROM tasks';
    } 
    else if (departmentRoles.includes(role)) {
      // Department heads see tasks in their department (created by or assigned to department members)
      query = `
        SELECT COUNT(*) AS count
        FROM tasks t
        JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE creator.department = ? OR (assignee.id IS NOT NULL AND assignee.department = ?)
      `;
      params = [department, department];
    }
    else {
      // Regular users see only their own tasks (created or assigned)
      query = `
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE created_by = ? OR assigned_to = ?
      `;
      params = [userId, userId];
    }

    // Add status filter if provided
    if (req.query.status) {
      const validStatuses = ['pending', 'in progress', 'completed'];
      if (validStatuses.includes(req.query.status)) {
        if (query.includes('WHERE')) {
          query += ' AND status = ?';
        } else {
          query += ' WHERE status = ?';
        }
        params.push(req.query.status);
      }
    }

    // Add priority filter if provided
    if (req.query.priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(req.query.priority)) {
        if (query.includes('WHERE')) {
          query += ' AND priority = ?';
        } else {
          query += ' WHERE priority = ?';
        }
        params.push(req.query.priority);
      }
    }

    const [rows] = await db.query(query, params);
    const count = rows[0]?.count || 0;

    res.json({ 
      success: true,
      count,
      filters: {
        role,
        department,
        status: req.query.status || 'all',
        priority: req.query.priority || 'all'
      }
    });

  } catch (err) {
    console.error('Error fetching task counts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message 
    });
  }
});

router.put('/tasks/:taskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const { userId, status } = req.body; // userId = current user trying to update; status = new status

    if (!taskId || !userId || !status) {
      return res.status(400).json({ message: 'taskId, userId, and status are required.' });
    }

    const validStatuses = ['pending', 'in progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    // Step 1: Verify the user is assigned_to (ONLY assignee can update status)
    const checkTaskQuery = 'SELECT created_by, assigned_to FROM tasks WHERE id = ?';
    const [results] = await db.query(checkTaskQuery, [taskId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = results[0];
    
    // Only the assigned user can update the status
    if (task.assigned_to !== userId) {
      return res.status(403).json({ message: 'Only the assigned user can update the task status' });
    }

    // Step 2: Update status
    const updateQuery = 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(updateQuery, [status, taskId]);
    
    res.json({ message: 'Task status updated successfully' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
});

// Request task report
router.post('/tasks/:taskId/request-report', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const { userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'taskId and userId are required.' });
    }

    // Verify the user is the creator of the task
    const checkTaskQuery = 'SELECT created_by, assigned_to FROM tasks WHERE id = ?';
    const [results] = await db.query(checkTaskQuery, [taskId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = results[0];
    
    if (task.created_by !== userId) {
      return res.status(403).json({ message: 'Only the task creator can request a report' });
    }

    // Update task to mark report as requested
    const updateQuery = 'UPDATE tasks SET report_requested = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(updateQuery, [taskId]);
    
    res.json({ message: 'Task report requested successfully' });
  } catch (err) {
    console.error('Error requesting task report:', err);
    res.status(500).json({ message: 'Failed to request task report', error: err.message });
  }
});

// Clear task report request (called when assignee submits the report)
router.post('/tasks/:taskId/clear-report-request', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const { userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'taskId and userId are required.' });
    }

    // Verify the user is the assignee of the task
    const checkTaskQuery = 'SELECT assigned_to FROM tasks WHERE id = ?';
    const [results] = await db.query(checkTaskQuery, [taskId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = results[0];
    
    if (task.assigned_to !== userId) {
      return res.status(403).json({ message: 'Only the task assignee can clear the report request' });
    }

    // Update task to clear report requested flag
    const updateQuery = 'UPDATE tasks SET report_requested = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(updateQuery, [taskId]);
    
    res.json({ message: 'Task report request cleared successfully' });
  } catch (err) {
    console.error('Error clearing task report request:', err);
    res.status(500).json({ message: 'Failed to clear task report request', error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // First, get the task to delete its file if it exists
    const [tasks] = await db.query('SELECT attachment_path FROM tasks WHERE id = ?', [taskId]);
    
    if (tasks.length > 0 && tasks[0].attachment_path) {
      // Delete the file if it exists
      try {
        if (fs.existsSync(tasks[0].attachment_path)) {
          fs.unlinkSync(tasks[0].attachment_path);
        }
      } catch (fileErr) {
        console.error('Error deleting file:', fileErr);
        // Continue with task deletion even if file deletion fails
      }
    }
    
    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await db.query(query, [taskId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
});

// Get task count
router.get('/count', async (req, res) => {
  try {
    const [results] = await db.query('SELECT COUNT(*) as count FROM tasks');
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Error fetching task count:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Download task attachment
router.get('/tasks/download/:taskId/:filename', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const filename = req.params.filename;
    const userId = req.query.userId;
    
    // Check if user has access to this task
    const [tasks] = await db.query(`
      SELECT attachment_path, attachment_original_name 
      FROM tasks 
      WHERE id = ? AND attachment = ? AND (created_by = ? OR assigned_to = ?)
    `, [taskId, filename, parseInt(userId), parseInt(userId)]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task or file not found, or access denied' });
    }
    
    const filePath = tasks[0].attachment_path;
    const originalName = tasks[0].attachment_original_name;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.download(filePath, originalName);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ message: 'Failed to download file', error: err.message });
  }
});

module.exports = router;