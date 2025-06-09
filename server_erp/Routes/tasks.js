const express = require('express');
const router = express.Router();
const db = require('../db'); // your mysql connection
// Assuming you have middleware to get current user ID (e.g. from JWT or session)

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

    db.query(checkQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking for duplicate task:', checkErr);
        return res.status(500).json({ message: 'Database error', error: checkErr });
      }
      if (checkResults.length > 0) {
        return res.status(409).json({ message: 'A task with the same title and assignment already exists.' });
      }

      const insertQuery = 'INSERT INTO tasks SET ?';
      db.query(insertQuery, task, (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting task:', insertErr);
          return res.status(500).json({ message: 'Failed to create task', error: insertErr });
        }

        return res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected error', error: error.message });
  }
});




router.get('/tasks', (req, res) => {
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
    JOIN users creator ON t.created_by = creator.id
    JOIN users assignee ON t.assigned_to = assignee.id
    ORDER BY t.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);
      return res.status(500).json({ message: 'Failed to fetch tasks', error: err });
    }
    res.json(results);
  });
});


router.get('/tasks/:id', (req, res) => {
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
    JOIN users creator ON t.created_by = creator.id
    JOIN users assignee ON t.assigned_to = assignee.id
    WHERE t.id = ?
  `;

  db.query(query, [taskId], (err, results) => {
    if (err) {
      console.error('Error fetching task:', err);
      return res.status(500).json({ message: 'Failed to fetch task', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(results[0]);
  });
});

router.get('/tasks/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // Step 1: Get the user's role
  const getUserRoleQuery = 'SELECT role FROM users WHERE id = ? LIMIT 1';

  db.query(getUserRoleQuery, [userId], (err, roleResult) => {
    if (err) {
      console.error('Error fetching user role:', err);
      return res.status(500).json({ message: 'Database error' });
    }

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
    db.query(taskQuery, params, (err, taskResults) => {
      if (err) {
        console.error('Error fetching tasks:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ tasks: taskResults });
    });
  });
});



router.put('/tasks/:taskId', (req, res) => {
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
  db.query(checkTaskQuery, [taskId], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = results[0];
    if (task.created_by !== userId && task.assigned_to !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Step 2: Update status
    const updateQuery = 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.query(updateQuery, [status, taskId], (updateErr) => {
      if (updateErr) {
        console.error('Update error:', updateErr);
        return res.status(500).json({ message: 'Failed to update task' });
      }

      return res.json({ message: 'Task status updated successfully' });
    });
  });
});


router.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const query = 'DELETE FROM tasks WHERE id = ?';

  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ message: 'Failed to delete task', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;
