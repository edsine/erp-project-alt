const express = require('express');
const router = express.Router();
const db = require('../db'); // your mysql connection

router.post('/tasks', async (req, res) => {
  const { title, dueDate, priority = 'medium', status = 'pending', assignedTo, createdBy } = req.body;

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
    due_date: dueDate || null,
    priority,
    status,
    created_by: createdBy,
    assigned_to: assignedTo || null,
  };

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
        t.due_date,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        t.created_by,
        creator.name AS created_by_name,
        t.assigned_to,
        assignee.name AS assigned_to_name
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
        t.due_date,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        t.created_by,
        creator.name AS created_by_name,
        t.assigned_to,
        assignee.name AS assigned_to_name
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

    // Step 1: Verify the user is assigned_to or created_by for this task
    const checkTaskQuery = 'SELECT created_by, assigned_to FROM tasks WHERE id = ?';
    const [results] = await db.query(checkTaskQuery, [taskId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = results[0];
    if (task.created_by !== userId && task.assigned_to !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
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

router.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
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

module.exports = router;