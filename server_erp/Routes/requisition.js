const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

// Multer setup: store files in 'uploads' folder, keep original filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Add timestamp to avoid name clashes
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create a new requisition with file upload
router.post('/requisitions', upload.single('attachment'), (req, res) => {
  const {
    title,
    description,
    items,
    quantity,
    unit_price,
    attachment_type = 'PDF',
    created_by
  } = req.body;

  // Validation: make sure required fields are present
  if (!title || !items || !quantity || !unit_price || !created_by) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Parse and validate numeric fields
  const parsedQuantity = parseInt(quantity, 10);
  const parsedUnitPrice = parseFloat(unit_price);

  if (isNaN(parsedQuantity) || isNaN(parsedUnitPrice)) {
    return res.status(400).json({ error: 'Quantity and unit price must be numbers' });
  }

  const attachmentPath = req.file ? req.file.path : null;

  const sql = `
    INSERT INTO requisitions 
      (title, description, items, quantity, unit_price, attachment, attachment_type, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, description, items, parsedQuantity, parsedUnitPrice, attachmentPath, attachment_type, created_by],
    (err, result) => {
      if (err) {
        console.error('Error inserting requisition:', err);
        return res.status(500).json({ error: 'Failed to create requisition' });
      }

      return res.status(201).json({
        message: 'Requisition created successfully',
        requisitionId: result.insertId
      });
    }
  );
});


router.post('/requisitions/:id/approve', (req, res) => {
  const requisitionId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required for approval.' });
  }

  // Map roles to approval fields and dependencies
  const roleApprovalMap = {
    gmd: { field: 'approved_by_gmd', dependsOn: null },
    finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
    gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
    chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
  };

  // Get the user's role
  const userSql = 'SELECT role FROM users WHERE id = ?';
  db.query(userSql, [user_id], (userErr, userResults) => {
    if (userErr || userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role;

    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: 'User role is not authorized to approve' });
    }

    if (role === 'gmd') {
      // GMD special case: can approve first or act as GMD2 after finance
      const gmdCheckSql = `
        SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 
        FROM requisitions 
        WHERE id = ?
      `;
      db.query(gmdCheckSql, [requisitionId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Requisition not found' });
        }

        const reqs = checkResults[0];

        if (reqs.approved_by_gmd === 0) {
          // First GMD approval
          const updateSql = `UPDATE requisitions SET approved_by_gmd = 1 WHERE id = ?`;
          db.query(updateSql, [requisitionId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating GMD approval' });
            }
            return res.status(200).json({ message: 'Approved by GMD', field: 'approved_by_gmd' });
          });
        } else if (reqs.approved_by_gmd === 1 && reqs.approved_by_finance === 1 && reqs.approved_by_gmd2 === 0) {
          // GMD acting as GMD2 after Finance approval
          const updateSql = `UPDATE requisitions SET approved_by_gmd2 = 1 WHERE id = ?`;
          db.query(updateSql, [requisitionId], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating GMD2 approval' });
            }
            return res.status(200).json({ message: 'Approved by GMD2', field: 'approved_by_gmd2' });
          });
        } else {
          return res.status(400).json({ message: 'GMD cannot approve at this stage or already approved' });
        }
      });
    } else {
      // Other roles: check dependency and approval status
      const { field, dependsOn } = roleApprovalMap[role];
      const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM requisitions WHERE id = ?`;
      db.query(checkSql, [requisitionId], (checkErr, checkResults) => {
        if (checkErr || checkResults.length === 0) {
          return res.status(404).json({ message: 'Requisition not found' });
        }

        const reqs = checkResults[0];

        if (reqs[field] === 1) {
          return res.status(400).json({ message: `Already approved by ${role}` });
        }

        if (dependsOn && reqs[dependsOn] !== 1) {
          return res.status(403).json({
            message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
          });
        }

        const updateSql = `UPDATE requisitions SET ${field} = 1 WHERE id = ?`;
        db.query(updateSql, [requisitionId], (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: 'Error updating approval status' });
          }
          return res.status(200).json({ message: `Approved by ${role}`, field });
        });
      });
    }
  });
});


router.get('/requisitions/user/:userId', (req, res) => {
  const { userId } = req.params;

  // Get user info first
  db.query('SELECT * FROM users WHERE id = ?', [userId], (userErr, userRows) => {
    if (userErr) {
      console.error('Error fetching user:', userErr);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRows[0];
    const role = user.role.toLowerCase(); // Normalize role
    let query = '';
    let queryParams = [];

    // Determine query based on user role
    switch (role) {
      case 'gmd':
        query = `
          SELECT * FROM requisitions
          WHERE 
            (approved_by_gmd = 0)
            OR (approved_by_gmd = 1 AND approved_by_finance = 1 AND approved_by_gmd2 = 0)
        `;
        break;
      case 'finance':
        query = 'SELECT * FROM requisitions WHERE approved_by_finance = 0';
        break;
      case 'chairman':
        query = 'SELECT * FROM requisitions WHERE approved_by_chairman = 0';
        break;
      case 'manager':
        query = 'SELECT * FROM requisitions WHERE status = "in_review"';
        break;
      default:
        // For other roles, just fetch their own requisitions
        query = 'SELECT * FROM requisitions WHERE created_by = ?';
        queryParams = [userId];
    }

    // Run the requisitions query
    db.query(query, queryParams, (reqErr, requisitions) => {
      if (reqErr) {
        console.error('Error fetching requisitions:', reqErr);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      res.json({ success: true, data: requisitions });
    });
  });
});


router.post('/requisitions/:id/reject', (req, res) => {
  const requisitionId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required for rejection.' });
  }

  // Map roles to rejection fields and dependencies (similar to approval)
  const roleRejectionMap = {
    gmd: { field: 'rejected_by_gmd', dependsOn: null },
    finance: { field: 'rejected_by_finance', dependsOn: 'approved_by_gmd' },
    gmd2: { field: 'rejected_by_gmd2', dependsOn: 'approved_by_finance' },
    chairman: { field: 'rejected_by_chairman', dependsOn: 'approved_by_gmd2' }
  };

  // Get user role
  db.query('SELECT role FROM users WHERE id = ?', [user_id], (userErr, userResults) => {
    if (userErr || userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role;

    if (!roleRejectionMap[role]) {
      return res.status(403).json({ message: 'User role is not authorized to reject' });
    }

    const { field, dependsOn } = roleRejectionMap[role];

    // Check if requisition exists and current approval/rejection status
    let selectFields = `${field}`;
    if (dependsOn) selectFields += `, ${dependsOn}`;
    db.query(`SELECT ${selectFields}, status FROM requisitions WHERE id = ?`, [requisitionId], (reqErr, reqResults) => {
      if (reqErr || reqResults.length === 0) {
        return res.status(404).json({ message: 'Requisition not found' });
      }

      const requisition = reqResults[0];

      if (requisition[field] === 1) {
        return res.status(400).json({ message: `Already rejected by ${role}` });
      }

      if (requisition.status === 'rejected') {
        return res.status(400).json({ message: 'This requisition is already rejected.' });
      }

      if (dependsOn && requisition[dependsOn] !== 1) {
        return res.status(403).json({
          message: `Cannot reject yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
        });
      }

      // Update rejection field and status (no reason)
      const updateSql = `UPDATE requisitions SET ${field} = 1, status = 'rejected' WHERE id = ?`;
      db.query(updateSql, [requisitionId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Error updating rejection status' });
        }
        return res.status(200).json({ message: `Rejected by ${role}`, field });
      });
    });
  });
});





// GET all requisitions
router.get('/requisitions', (req, res) => {
  const sql = 'SELECT * FROM requisitions';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching requisitions:', err);
      return res.status(500).json({ message: 'Failed to fetch requisitions' });
    }

    res.status(200).json(results);
  });
});


router.get('/requisitions/:id', (req, res) => {
  const requisitionId = req.params.id;
  const sql = 'SELECT * FROM requisitions WHERE id = ?';

  db.query(sql, [requisitionId], (err, results) => {
    if (err) {
      console.error('Error fetching requisition:', err);
      return res.status(500).json({ message: 'Failed to fetch requisition' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.status(200).json(results[0]);
  });
});

router.delete('/requisitions/:id', (req, res) => {
  const requisitionId = req.params.id;

  const deleteQuery = 'DELETE FROM requisitions WHERE id = ?';

  db.query(deleteQuery, [requisitionId], (err, result) => {
    if (err) {
      console.error('Error deleting requisition:', err);
      return res.status(500).json({ message: 'Error deleting requisition' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.status(200).json({ message: 'Requisition deleted successfully' });
  });
});

module.exports = router
