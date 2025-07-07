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
  try {
    const {
      user_id,
      type,
      start_date,
      end_date,
      reason,
      contact
    } = req.body;

    if (!user_id || !type || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const total_days = Math.ceil(
      (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)
    ) + 1;

    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    const fileUrl = req.file ? `${req.protocol}://${req.get('host')}${filePath}` : null;

    const [result] = await db.execute(
      `INSERT INTO leave_requests 
      (user_id, type, start_date, end_date, total_days, reason, contact, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, type, start_date, end_date, total_days, reason, contact, filePath]
    );

    res.status(201).json({
      message: 'Leave request created',
      id: result.insertId,
      attachment_url: fileUrl
    });
  } catch (err) {
    console.error('Upload or DB error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
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
    const [rows] = await db.execute(
      'SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching leave by user_id:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests for user' });
  }
});



// Approve leave request
router.post('/leave/:id/approve', async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required for approval.' });
    }

    const roleApprovalMap = {
      gmd:      { field: 'approved_by_gmd',     dependsOn: null },
      finance:  { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
      gmd2:     { field: 'approved_by_gmd2',    dependsOn: 'approved_by_finance' },
      chairman: { field: 'approved_by_chairman',dependsOn: 'approved_by_gmd2' }
    };

    // Get user's role
    const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role?.trim().toLowerCase();
    console.log('🛂 Approval Attempt:', { user_id, role });

    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: `User role (${role}) is not authorized to approve` });
    }

    // Special handling for gmd (can approve gmd2 if flow is satisfied)
    if (role === 'gmd') {
      const [checkResults] = await db.query(`
        SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM leave_requests WHERE id = ?
      `, [leaveId]);

      if (checkResults.length === 0) {
        return res.status(404).json({ message: 'Leave request not found' });
      }

      const leave = checkResults[0];

      if (leave.approved_by_gmd === 0) {
        await db.query('UPDATE leave_requests SET approved_by_gmd = 1 WHERE id = ?', [leaveId]);
        return res.status(200).json({ message: 'Approved by GMD', field: 'approved_by_gmd' });
      } else if (leave.approved_by_gmd === 1 && leave.approved_by_finance === 1 && leave.approved_by_gmd2 === 0) {
        await db.query('UPDATE leave_requests SET approved_by_gmd2 = 1 WHERE id = ?', [leaveId]);
        return res.status(200).json({ message: 'Approved by GMD2', field: 'approved_by_gmd2' });
      } else {
        return res.status(400).json({ message: 'GMD cannot approve at this stage or already approved' });
      }
    }

    // For finance, gmd2, chairman
    const { field, dependsOn } = roleApprovalMap[role];
    const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM leave_requests WHERE id = ?`;
    const [checkResults] = await db.query(checkSql, [leaveId]);

    if (checkResults.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leave = checkResults[0];

    if (leave[field] === 1) {
      return res.status(400).json({ message: `Already approved by ${role}` });
    }

    if (dependsOn && leave[dependsOn] !== 1) {
      return res.status(403).json({
        message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
      });
    }

    // Approve
    await db.query(`UPDATE leave_requests SET ${field} = 1 WHERE id = ?`, [leaveId]);

    // Final status update
    const [allResults] = await db.query(`
      SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2, approved_by_chairman
      FROM leave_requests
      WHERE id = ?
    `, [leaveId]);

    if (allResults.length > 0) {
      const allApproved = Object.values(allResults[0]).every(val => val === 1);
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
