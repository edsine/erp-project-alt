const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const fs = require('fs');

// Configure storage for PDF files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// Filter: only allow PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });



router.post('/leave', upload.single('attachment'), async (req, res) => {
  const {
    user_id,
    type,
    start_date,
    end_date,
    total_days,
    reason,
    contact
  } = req.body;

  const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await db.query(
      `INSERT INTO leave_requests (
        user_id, type, start_date, end_date, total_days,
        reason, contact, attachment_url, status,
        approved_by_manager, approved_by_executive, approved_by_hr,
        approved_by_gmd, approved_by_chairman,
        rejected_by_manager, rejected_by_executive, rejected_by_hr,
        rejected_by_gmd, rejected_by_chairman
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [
        user_id,
        type,
        start_date,
        end_date,
        total_days,
        reason,
        contact,
        attachment_url
      ]
    );

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave_request_id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error saving leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



router.get('/leave', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET all leaves error:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});


router.get('/leave/:id', async (req, res) => {
  const leaveId = req.params.id;

  try {
    const [rows] = await db.execute('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
});


// GET leave requests by user ID
router.get('/leave/user/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    // Step 1: Fetch user's role and department
    const [userResult] = await db.query(
      'SELECT role, department FROM users WHERE id = ?',
      [user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role, department } = userResult[0];

    let query = '';
    let params = [];

    // Step 2: Build query based on role
    if (role === 'staff') {
      query = `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC`;
      params = [user_id];
    } else if (role === 'manager' || role === 'executive') {
      query = `
        SELECT lr.*, u.name AS requester_name
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE u.department = ? AND lr.user_id != ?
        ORDER BY lr.created_at DESC
      `;
      params = [department, user_id];
    } else if (['hr', 'gmd', 'chairman'].includes(role)) {
      query = `
        SELECT lr.*, u.name AS requester_name, u.department
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        ORDER BY lr.created_at DESC
      `;
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    // Step 3: Run query
    const [rows] = await db.query(query, params);
    res.json(rows);

  } catch (err) {
    console.error('❌ Error in /leave/user/:user_id:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});



// Approve leave request
router.post('/leave/:id/approve', async (req, res) => {
  const leaveId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required for approval.' });
  }

  // Map roles to approval fields and their dependencies
  const roleApprovalMap = {
    manager:   { field: 'approved_by_manager',   dependsOn: null },
    executive: { field: 'approved_by_executive', dependsOn: 'approved_by_manager' },
    hr:        { field: 'approved_by_hr',        dependsOn: 'approved_by_executive' },
    gmd:       { field: 'approved_by_gmd',       dependsOn: 'approved_by_hr' },
    chairman:  { field: 'approved_by_chairman',  dependsOn: 'approved_by_gmd' },
  };

  try {
    // 1. Get user's role
    const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role?.trim().toLowerCase();

    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: `User role (${role}) is not authorized to approve.` });
    }

    const { field, dependsOn } = roleApprovalMap[role];

    // 2. Get current approval status
    const [leaveCheck] = await db.query(
      `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM leave_requests WHERE id = ?`,
      [leaveId]
    );

    if (leaveCheck.length === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const leave = leaveCheck[0];

    if (leave[field] === 1) {
      return res.status(400).json({ message: `Already approved by ${role}` });
    }

    if (dependsOn && leave[dependsOn] !== 1) {
      return res.status(403).json({
        message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
      });
    }

    // 3. Approve the request
    await db.query(`UPDATE leave_requests SET ${field} = 1 WHERE id = ?`, [leaveId]);

    // 4. Check if all stages are approved
    const [all] = await db.query(`
      SELECT approved_by_manager, approved_by_executive, approved_by_hr, approved_by_gmd, approved_by_chairman
      FROM leave_requests WHERE id = ?
    `, [leaveId]);

    if (all.length > 0) {
      const allApproved = Object.values(all[0]).every(val => val === 1);
      if (allApproved) {
        await db.query(`UPDATE leave_requests SET status = 'approved' WHERE id = ?`, [leaveId]);
      }
    }

    return res.status(200).json({ message: `Approved by ${role}`, field });

  } catch (err) {
    console.error('🔥 Error in leave approval process:', err);
    return res.status(500).json({ message: 'Error updating approval status' });
  }
});





router.delete('/leave/:id', async (req, res) => {
  const leaveId = req.params.id;

  try {
    // Get the leave to delete
    const [rows] = await db.execute('SELECT attachment_url FROM leave_requests WHERE id = ?', [leaveId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const attachmentUrl = rows[0].attachment_url;

    // Delete file if exists
    if (attachmentUrl) {
      const filePath = path.join(__dirname, '..', attachmentUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.warn('File deletion skipped:', err.message);
      });
    }

    // Delete record from DB
    await db.execute('DELETE FROM leave_requests WHERE id = ?', [leaveId]);

    res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});


// Get leave request count

router.get('/leave-requests/count/user/:userId', async (req, res) => {
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
    const approvalRoles = {
      'gmd': 'approved_by_gmd',
      'finance': 'approved_by_finance',
      'chairman': 'approved_by_chairman'
    };
    const departmentRoles = ['manager', 'executive', 'hr'];

    let query = '';
    let params = [];

    if (approvalRoles[role]) {
      // Approval roles (GMD, Finance, Chairman)
      const approvalField = approvalRoles[role];
      query = `
        SELECT COUNT(*) AS count
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.status = 'pending'
        AND lr.${approvalField} = 0
        AND (lr.rejected_by_${role} = 0 OR lr.rejected_by_${role} IS NULL)
      `;
    } 
    else if (departmentRoles.includes(role)) {
      // Department roles (Manager, Executive, HR)
      query = `
        SELECT COUNT(*) AS count
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE u.department = ?
        AND lr.status = 'pending'
        ${
          role === 'hr' ? 
          "AND lr.type IN ('annual', 'sick', 'maternity', 'paternity', 'unpaid')" : 
          ""
        }
      `;
      params = [department];
    }
    else {
      // Regular users see only their own leave requests
      query = `
        SELECT COUNT(*) AS count
        FROM leave_requests
        WHERE user_id = ?
      `;
      params = [userId];
    }

    // Add status filter if provided
    if (req.query.status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (validStatuses.includes(req.query.status)) {
        if (query.includes('WHERE')) {
          query += ' AND status = ?';
        } else {
          query += ' WHERE status = ?';
        }
        params.push(req.query.status);
      }
    }

    // Add type filter if provided
    if (req.query.type) {
      const validTypes = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'];
      if (validTypes.includes(req.query.type)) {
        if (query.includes('WHERE')) {
          query += ' AND type = ?';
        } else {
          query += ' WHERE type = ?';
        }
        params.push(req.query.type);
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
        type: req.query.type || 'all'
      }
    });

  } catch (err) {
    console.error('Error fetching leave request counts:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: err.message 
    });
  }
});


module.exports = router;
