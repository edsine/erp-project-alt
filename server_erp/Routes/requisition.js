const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const fs = require('fs');


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



router.post('/requisitions', upload.single('attachment'), async (req, res) => {
  try {
    const {
      title,
      description,
      items,
      quantity,
      unit_price,
      created_by
    } = req.body;

    // Validate required fields
    if (!title || !items || !quantity || !unit_price || !created_by) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse the items JSON string
    let parsedItems;
    try {
      parsedItems = JSON.parse(items);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid items format' });
    }

    // Format items as a detailed string
    const itemsString = parsedItems.map(item => {
      return `${item.name} (Qty: ${item.quantity}, Price: ${item.unitPrice})`;
    }).join('; ');

    // Attachment details
    const attachmentPath = req.file ? req.file.path : null;
    const attachmentType = req.file ? path.extname(req.file.originalname).substring(1) : null;

    // Insert into DB
    const sql = `
      INSERT INTO requisitions 
        (title, description, items, quantity, unit_price, attachment, attachment_type, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      title,
      description,
      itemsString, // Save the human-readable version
      quantity,
      unit_price,
      attachmentPath,
      attachmentType,
      created_by
    ]);

    return res.status(201).json({
      message: 'Requisition created successfully',
      requisitionId: result.insertId
    });

  } catch (err) {
    console.error('Error inserting requisition:', err);
    return res.status(500).json({ error: 'Failed to create requisition', details: err.message });
  }
});

// router.post('/requisitions/:id/approve', async (req, res) => {
//   try {
//     const requisitionId = req.params.id;
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({ message: 'User ID is required for approval.' });
//     }

//     // Define role-to-approval field mapping
//     const roleApprovalMap = {
//       manager:   { field: 'approval_manager',   dependsOn: null,                  departmentMatch: true },
//       executive: { field: 'approval_executive', dependsOn: 'approval_manager',   departmentMatch: true },
//       finance:   { field: 'approval_finance',   dependsOn: 'approval_executive' },
//       gmd:       { field: 'approval_gmd',       dependsOn: 'approval_finance' },
//       chairman:  { field: 'approval_chairman',  dependsOn: 'approval_gmd' }
//     };

//     // Get user role and department
//     const [userResults] = await db.query('SELECT role, department FROM users WHERE id = ?', [user_id]);
//     if (userResults.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const { role, department: userDept } = userResults[0];

//     // Ensure user has a valid approval role
//     if (!roleApprovalMap[role]) {
//       return res.status(403).json({ message: 'User role is not authorized to approve' });
//     }

//     // Get requisition and approval fields
//     const [requisitionResults] = await db.query(
//       'SELECT created_by, approval_manager, approval_executive, approval_finance, approval_gmd, approval_chairman FROM requisitions WHERE id = ?',
//       [requisitionId]
//     );

//     if (requisitionResults.length === 0) {
//       return res.status(404).json({ message: 'Requisition not found' });
//     }

//     const requisition = requisitionResults[0];

//     // Get sender department
//     const [senderResults] = await db.query('SELECT department FROM users WHERE id = ?', [requisition.created_by]);
//     if (senderResults.length === 0) {
//       return res.status(404).json({ message: 'Sender user not found' });
//     }

//     const senderDept = senderResults[0].department;

//     // Special case: GMD approval only once
//     if (role === 'gmd') {
//       if (requisition.approval_gmd === 'approved') {
//         return res.status(400).json({ message: 'Already approved by GMD' });
//       }

//       if (requisition.approval_finance !== 'approved') {
//         return res.status(403).json({ message: 'Cannot approve yet. Waiting for finance approval.' });
//       }

//       await db.query('UPDATE requisitions SET approval_gmd = "approved" WHERE id = ?', [requisitionId]);
//       return res.status(200).json({ message: 'Approved by GMD', field: 'approval_gmd' });
//     }

//     // Standard flow
//     const { field, dependsOn, departmentMatch } = roleApprovalMap[role];

//     if (requisition[field] === 'approved') {
//       return res.status(400).json({ message: `Already approved by ${role}` });
//     }

//     if (dependsOn && requisition[dependsOn] !== 'approved') {
//       return res.status(403).json({ message: `Cannot approve yet. Waiting for ${dependsOn.replace('approval_', '')} approval.` });
//     }

//     if (departmentMatch && userDept !== senderDept) {
//       return res.status(403).json({ message: `Approval denied. ${role} must be from the same department as the requisition sender.` });
//     }

//     await db.query(`UPDATE requisitions SET ${field} = 'approved' WHERE id = ?`, [requisitionId]);
//     return res.status(200).json({ message: `Approved by ${role}`, field });

//   } catch (err) {
//     console.error('Error in approval process:', err);
//     return res.status(500).json({ message: 'Error updating approval status' });
//   }
// });



// router.get('/requisitions/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // 1. Get user info
//     const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

//     if (userRows.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const user = userRows[0];
//     const role = user.role.toLowerCase(); // Normalize
//     const department = user.department;   // Assuming user table has this field

//     let query = '';
//     let queryParams = [];

//     switch (role) {
//       case 'manager':
//         query = `
//           SELECT r.* FROM requisitions r
//           JOIN users u ON r.created_by = u.id
//           WHERE r.approval_manager = 'pending' AND u.department = ?
//         `;
//         queryParams = [department];
//         break;

//       case 'executive':
//         query = `
//           SELECT r.* FROM requisitions r
//           JOIN users u ON r.created_by = u.id
//           WHERE r.approval_executive = 'pending' AND u.department = ?
//         `;
//         queryParams = [department];
//         break;

//       case 'finance':
//         query = `SELECT * FROM requisitions WHERE approval_finance = 'pending'`;
//         break;

//       case 'gmd':
//         query = `SELECT * FROM requisitions WHERE approval_gmd = 'pending'`;
//         break;

//       case 'chairman':
//         query = `SELECT * FROM requisitions WHERE approval_chairman = 'pending'`;
//         break;

//       default:
//         query = `SELECT * FROM requisitions WHERE created_by = ?`;
//         queryParams = [userId];
//         break;
//     }

//     const [requisitions] = await db.query(query, queryParams);

//     res.json({ success: true, data: requisitions });
//   } catch (err) {
//     console.error('Error fetching requisitions:', err);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

//this is for the count loginc



router.post('/requisitions/:id/approve', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required for approval.' });
    }

    const roleApprovalMap = {
      manager:   { field: 'approval_manager',   dependsOn: null,                  departmentMatch: true },
      executive: { field: 'approval_executive', dependsOn: 'approval_manager',   departmentMatch: true },
      finance:   { field: 'approval_finance',   dependsOn: null },
      gmd:       { field: 'approval_gmd',       dependsOn: 'approval_finance' },
      chairman:  { field: 'approval_chairman',  dependsOn: 'approval_gmd' }
    };

    const [userResults] = await db.query('SELECT role, department FROM users WHERE id = ?', [user_id]);
    if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const { role, department: userDept } = userResults[0];
    if (!roleApprovalMap[role]) {
      return res.status(403).json({ message: 'User role is not authorized to approve' });
    }

    const [requisitionResults] = await db.query(
      `SELECT created_by, approval_manager, approval_executive, approval_finance, approval_gmd, approval_chairman 
       FROM requisitions WHERE id = ?`, [requisitionId]);

    if (requisitionResults.length === 0) return res.status(404).json({ message: 'Requisition not found' });
    const requisition = requisitionResults[0];

    const [senderResults] = await db.query('SELECT department FROM users WHERE id = ?', [requisition.created_by]);
    if (senderResults.length === 0) return res.status(404).json({ message: 'Sender user not found' });

    const senderDept = senderResults[0].department;
    const isICT = senderDept.toLowerCase() === 'ict';

    const { field, dependsOn, departmentMatch } = roleApprovalMap[role];

    if (requisition[field] === 'approved') {
      return res.status(400).json({ message: `Already approved by ${role}` });
    }

    // Approval Logic: Dynamic Based on Sender Department
    if (isICT) {
      // ICT flow (full approval chain)
      if (dependsOn && requisition[dependsOn] !== 'approved') {
        return res.status(403).json({
          message: `Cannot approve yet. Waiting for ${dependsOn.replace('approval_', '')} approval.`,
        });
      }

      if (departmentMatch && userDept !== senderDept) {
        return res.status(403).json({
          message: `Approval denied. ${role} must be from the same department as the requisition sender.`,
        });
      }
    } else {
      // Non-ICT: Only allow Finance → GMD → Chairman
      const allowedNonICTRoles = ['finance', 'gmd', 'chairman'];
      if (!allowedNonICTRoles.includes(role)) {
        return res.status(403).json({ message: 'Only Finance, GMD, or Chairman can approve non-ICT requisitions.' });
      }

      if (role === 'gmd' && requisition.approval_finance !== 'approved') {
        return res.status(403).json({ message: 'GMD must wait for Finance approval.' });
      }

      if (role === 'chairman' && requisition.approval_gmd !== 'approved') {
        return res.status(403).json({ message: 'Chairman must wait for GMD approval.' });
      }
    }

    await db.query(`UPDATE requisitions SET ${field} = 'approved' WHERE id = ?`, [requisitionId]);
    return res.status(200).json({ message: `Approved by ${role}`, field });

  } catch (err) {
    console.error('Error in approval process:', err);
    return res.status(500).json({ message: 'Error updating approval status' });
  }
});











router.get('/requisitions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRows[0];
    const role = user.role.toLowerCase();
    const department = user.department;

    let query = '';
    let queryParams = [];

    switch (role) {
      case 'manager':
        query = `
          SELECT r.* FROM requisitions r
          JOIN users u ON r.created_by = u.id
          WHERE r.approval_manager = 'pending' AND u.department = ?
        `;
        queryParams = [department];
        break;

      case 'executive':
        query = `
          SELECT r.* FROM requisitions r
          JOIN users u ON r.created_by = u.id
          WHERE r.approval_executive = 'pending' AND u.department = ?
        `;
        queryParams = [department];
        break;

      case 'finance':
        query = `
          SELECT * FROM requisitions 
          WHERE approval_finance = 'pending'
        `;
        break;

      case 'gmd':
        query = `SELECT * FROM requisitions WHERE approval_gmd = 'pending'`;
        break;

      case 'chairman':
        query = `SELECT * FROM requisitions WHERE approval_chairman = 'pending'`;
        break;

      default:
        query = `SELECT * FROM requisitions WHERE created_by = ?`;
        queryParams = [userId];
        break;
    }

    const [requisitions] = await db.query(query, queryParams);
    console.log("Requisitions returned:", requisitions.map(r => ({
      id: r.id,
      department: r.sender_department,
      approval: r.approval_finance
    })));
    res.json({ success: true, data: requisitions });

  } catch (err) {
    console.error('Error fetching requisitions:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});





router.get('/requisitions/count/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    const role = user.role.toLowerCase();
    const department = user.department;

    let query = '';
    let params = [];

    if (role === 'manager') {
      query = `
        SELECT COUNT(*) AS count
        FROM requisitions r
        JOIN users u ON r.created_by = u.id
        WHERE u.department = ? 
        AND r.approval_manager = 'pending'
        AND r.status = 'pending'
      `;
      params = [department];
    } 
    else if (role === 'executive') {
      query = `
        SELECT COUNT(*) AS count
        FROM requisitions r
        JOIN users u ON r.created_by = u.id
        WHERE u.department = ? 
        AND r.approval_executive = 'pending'
        AND r.status = 'pending'
      `;
      params = [department];
    }
    else if (['finance', 'gmd', 'chairman'].includes(role)) {
      const approvalField = `approval_${role}`;
      query = `
        SELECT COUNT(*) AS count
        FROM requisitions
        WHERE ${approvalField} = 'pending'
        AND status = 'pending'
      `;
    }
    else {
      // Regular user (staff/hr)
      query = `
        SELECT COUNT(*) AS count 
        FROM requisitions 
        WHERE created_by = ?
        AND status = 'pending'
      `;
      params = [userId];
    }

    const [rows] = await db.query(query, params);
    const count = rows[0]?.count || 0;

    res.json({ count });

  } catch (err) {
    console.error('Error fetching requisition count:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});






router.post('/requisitions/:id/reject', async (req, res) => {
  try {
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
    const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [user_id]);

    if (userResults.length === 0) {
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
    const [reqResults] = await db.query(`SELECT ${selectFields}, status FROM requisitions WHERE id = ?`, [requisitionId]);

    if (reqResults.length === 0) {
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
    await db.query(updateSql, [requisitionId]);
    
    return res.status(200).json({ message: `Rejected by ${role}`, field });
  } catch (err) {
    console.error('Error in rejection process:', err);
    return res.status(500).json({ message: 'Error updating rejection status' });
  }
});

// GET all requisitions
router.get('/requisitions', async (req, res) => {
  try {
    const sql = 'SELECT * FROM requisitions';
    const [results] = await db.query(sql);

    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching requisitions:', err);
    return res.status(500).json({ message: 'Failed to fetch requisitions' });
  }
});

router.get('/requisitions/:id', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const sql = 'SELECT * FROM requisitions WHERE id = ?';

    const [results] = await db.query(sql, [requisitionId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error('Error fetching requisition:', err);
    return res.status(500).json({ message: 'Failed to fetch requisition' });
  }
});

router.delete('/requisitions/:id', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const deleteQuery = 'DELETE FROM requisitions WHERE id = ?';

    const [result] = await db.query(deleteQuery, [requisitionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.status(200).json({ message: 'Requisition deleted successfully' });
  } catch (err) {
    console.error('Error deleting requisition:', err);
    return res.status(500).json({ message: 'Error deleting requisition' });
  }
});
// Get requisition count
router.get('/count', async (req, res) => {
  try {
    const [results] = await db.query('SELECT COUNT(*) as count FROM requisitions');
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Error fetching requisition count:', err);
    res.status(500).json({ message: 'Database error' });
  }
});


router.get('/requisitions/download/:id', async (req, res) => {
  try {
    const requisitionId = req.params.id;

    const [results] = await db.query('SELECT attachment, title FROM requisitions WHERE id = ?', [requisitionId]);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    const requisition = results[0];

    if (!requisition.attachment) {
      return res.status(404).json({ message: 'No attachment found for this requisition' });
    }

    const filePath = path.resolve(requisition.attachment);
    const fileName = requisition.title.replace(/\s+/g, '_') + path.extname(filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Attachment file missing on server' });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).end('Error downloading file');
      }
    });

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Failed to download attachment' });
  }
});
module.exports = router; 

/*

 UI = user interface is kek
 AD/ OD
 @ d phase on of mgration
 launch data
 strategic uncentive deployment
  force staff to use
  enforcement
  please
  sumamissen
  fall in line gm
  filgm
  it dept
  chamoions of change
  focus on op data
  let mg n gms insist on.....
  trained focal people// people of focus
  its abt time
  time travel
  travel on time
  forget about circular
  roll out procedure
  
*/