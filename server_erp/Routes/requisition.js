const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Updated file filter to accept multiple file types (matching your frontend)
const fileFilter = (req, file, cb) => {
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
    cb(new Error('Unsupported file type!'), false);
  }
};

// Updated multer instance to accept multiple files
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB to match frontend
});

// Updated route to handle multiple files
// Updated POST route with separate files table
router.post('/requisitions', upload.array('files', 10), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      title,
      description,
      priority = 'medium',
      created_by,
      items = [],
      total_amount
    } = req.body;

    console.log('📝 Request body:', req.body);
    console.log('📎 Files received:', req.files);

    // Validate required fields
    if (!title || !created_by) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Title and created_by are required fields' 
      });
    }

    // Validate items
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (e) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid items format' });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Get sender info
    const [[user]] = await connection.query(
      'SELECT role, department FROM users WHERE id = ?',
      [created_by]
    );

    if (!user) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const sender_role = user.role;
    const sender_department = user.department;

    // Insert requisition (without file_path since we're using separate table)
    const [result] = await connection.execute(
      `INSERT INTO requisitions 
        (title, description, priority, created_by, sender_role, sender_department, total_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        priority,
        created_by,
        sender_role,
        sender_department,
        total_amount,
        'submitted'
      ]
    );

    const requisitionId = result.insertId;

    // Insert items
    for (const item of parsedItems) {
      await connection.execute(
        `INSERT INTO requisition_items 
          (requisition_id, name, quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          requisitionId,
          item.name,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price
        ]
      );
    }

    // Insert files (if any)
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.execute(
          `INSERT INTO requisition_files 
            (requisition_id, filename, original_name, file_type, file_size) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            requisitionId,
            file.filename,
            file.originalname,
            file.mimetype,
            file.size
          ]
        );
        
        uploadedFiles.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Requisition created successfully',
      requisition_id: requisitionId,
      files_uploaded: uploadedFiles.length,
      files: uploadedFiles
    });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error creating requisition:', err.message);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  } finally {
    connection.release();
  }
});


// Updated GET routes with separate files table
router.get('/requisitions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    console.log(`📋 Fetching requisitions for user ${userId} with role ${role}`);

    let query;
    let params;

    // Different queries based on user role
    if (role.toLowerCase() === 'employee' || role.toLowerCase() === 'staff') {
      query = `
        SELECT 
          r.*,
          u.name as creator_name,
          u.department as creator_department,
          r.paid_by_finance
        FROM requisitions r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.created_by = ?
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          r.*,
          u.name as creator_name,
          u.department as creator_department
        FROM requisitions r
        LEFT JOIN users u ON r.created_by = u.id
        ORDER BY r.created_at DESC
      `;
      params = [];
    }

    const [requisitions] = await db.execute(query, params);

    // Process each requisition to include items and files
    const processedRequisitions = await Promise.all(
      requisitions.map(async (requisition) => {
        // Get items for this requisition
        const [items] = await db.execute(
          'SELECT * FROM requisition_items WHERE requisition_id = ?',
          [requisition.id]
        );

        // Get files for this requisition
        const [files] = await db.execute(
          'SELECT * FROM requisition_files WHERE requisition_id = ?',
          [requisition.id]
        );

        // Format files for frontend
        const attachments = files.map(file => ({
          filename: file.filename,
          originalname: file.original_name,
          mimetype: file.file_type,
          size: file.file_size,
          path: `/uploads/${file.filename}`
        }));

        return {
          ...requisition,
          items: items || [],
          attachments: JSON.stringify(attachments)
        };
      })
    );

    res.json(processedRequisitions);

  } catch (err) {
    console.error('❌ Error fetching requisitions:', err.message);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  }
});

// Updated GET single requisition route
router.get('/requisitions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📋 Fetching requisition ${id}`);

    // Get requisition details
    const [requisitions] = await db.execute(
      `SELECT 
        r.*,
        u.name as creator_name,
        u.department as creator_department,
        u.email as creator_email
      FROM requisitions r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?`,
      [id]
    );

    if (requisitions.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    const requisition = requisitions[0];

    // Get items for this requisition
    const [items] = await db.execute(
      'SELECT * FROM requisition_items WHERE requisition_id = ?',
      [id]
    );

    // Get files for this requisition
    const [files] = await db.execute(
      'SELECT * FROM requisition_files WHERE requisition_id = ?',
      [id]
    );

    // Format files for frontend
    const attachments = files.map(file => ({
      filename: file.filename,
      originalname: file.original_name,
      mimetype: file.file_type,
      size: file.file_size,
      path: `/uploads/${file.filename}`
    }));

    const response = {
      ...requisition,
      items: items || [],
      attachments: JSON.stringify(attachments)
    };

    res.json(response);

  } catch (err) {
    console.error('❌ Error fetching requisition:', err.message);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  }
});

module.exports = router;

router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // Send the file
  res.sendFile(filePath);
});

// Get all requisitions for a user based on role
router.get('/requisitions/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let { role, status } = req.query;

  const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];

  try {
    // Get user's department and actual role from DB
    const [userRows] = await db.query(
      `SELECT department, role FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { department, role: actualRole } = userRows[0];
    const userRole = actualRole.toLowerCase();

    // Normalize role from query
    let normalizedRole = role?.toLowerCase();

    // OVERRIDE role if dept ≠ ICT and actual role is finance
    if (department.toLowerCase() !== 'ict' && userRole === 'finance') {
      normalizedRole = 'finance';
    }

    // Base query parts
    const baseSelect = `
      SELECT 
        r.*, 
        u.role AS sender_role, 
        u.department AS sender_department,
        r.approved_by_manager AS manager_approved,
        r.approved_by_executive AS executive_approved,
        r.approved_by_finance AS finance_approved,
        r.approved_by_gmd AS gmd_approved,
        r.approved_by_chairman AS chairman_approved
      FROM requisitions r
      JOIN users u ON r.created_by = u.id
    `;

    let query = '';
    let values = [];

    // If no role specified or role is not an approval role, just get user's own requisitions
    if (!normalizedRole || !approvalRoles.includes(normalizedRole)) {
      let statusCondition = '';
      if (status === 'approved') {
        statusCondition = 'AND (r.approved_by_manager = 1 OR r.approved_by_executive = 1 OR r.approved_by_finance = 1 OR r.approved_by_gmd = 1 OR r.approved_by_chairman = 1)';
      } else if (status === 'pending') {
        statusCondition = 'AND (r.approved_by_manager IS NULL OR r.approved_by_executive IS NULL OR r.approved_by_finance IS NULL OR r.approved_by_gmd IS NULL OR r.approved_by_chairman IS NULL)';
      }

      query = `
        ${baseSelect}
        WHERE r.created_by = ?
        ${statusCondition}
        ORDER BY r.created_at DESC
      `;
      values = [userId];
    } else {
      // For approvers, get requisitions they need to approve + requisitions they've approved + their own requisitions
      const approvalField = `approved_by_${normalizedRole}`;
      const noDeptRoles = ['finance', 'gmd', 'chairman'];

      // Status conditions
      let pendingCondition = '';
      let approvedCondition = '';

      if (status === 'pending') {
        pendingCondition = `AND ${approvalField} IS NULL`;
      } else if (status === 'approved') {
        approvedCondition = `AND ${approvalField} = 1`;
      }

      if (noDeptRoles.includes(normalizedRole)) {
        // For roles without department restrictions (finance, gmd, chairman)
        query = `
          ${baseSelect}
          WHERE (
            r.created_by = ?
            OR (
              ${approvalField} IS NULL
              ${pendingCondition}
              ${approvedCondition}
              ${normalizedRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
            )
            OR ${approvalField} = 1  /* Requisitions this role has already approved */
          )
          ORDER BY r.created_at DESC
        `;
        values = [userId];
      } else {
        // For department-restricted roles (manager, executive)
        query = `
          ${baseSelect}
          WHERE (
            r.created_by = ?
            OR (
              ${approvalField} IS NULL
              AND u.department = ?
              ${pendingCondition}
              ${approvedCondition}
            )
            OR ${approvalField} = 1  /* Requisitions this role has already approved */
          )
          ORDER BY r.created_at DESC
        `;
        values = [userId, department];
      }
    }

    const [rows] = await db.query(query, values);

    // Get items for each requisition and process attachments
    for (const row of rows) {
      const [items] = await db.query(
        'SELECT name, quantity, unit_price, total_price FROM requisition_items WHERE requisition_id = ?',
        [row.id]
      );
      row.items = items || [];

      // Process file_path - Handle both old and new formats
      if (row.file_path) {
        try {
          const fileData = JSON.parse(row.file_path);
          
          if (Array.isArray(fileData) && fileData.length > 0) {
            // Check if it's the new format (objects with originalname) or old format (just filenames)
            if (typeof fileData[0] === 'string') {
              // Old format: just filenames
              row.attachments = JSON.stringify(fileData.map(filename => ({
                filename: filename,
                originalname: filename, // Use filename as originalname for old data
                mimetype: getMimeTypeFromFilename(filename),
                size: 0,
                url: `/uploads/${filename}`
              })));
            } else {
              // New format: already contains file objects
              row.attachments = JSON.stringify(fileData);
            }
          } else {
            row.attachments = null;
          }
        } catch (e) {
          console.error('Error parsing file_path for requisition', row.id, e);
          row.attachments = null;
        }
      } else {
        row.attachments = null;
      }

      // Add overall approval status
      row.approval_status = 'pending';
      if (row.approved_by_chairman) {
        row.approval_status = 'fully_approved';
      } else if (row.approved_by_gmd) {
        row.approval_status = 'pending_chairman';
      } else if (row.approved_by_finance) {
        row.approval_status = 'pending_gmd';
      } else if (row.approved_by_executive) {
        row.approval_status = 'pending_finance';
      } else if (row.approved_by_manager) {
        row.approval_status = 'pending_executive';
      }
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching requisitions for user and role:', error);
    res.status(500).json({ message: 'Server error while fetching user requisitions' });
  }
});

// Helper function to get MIME type from filename
function getMimeTypeFromFilename(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Approve requisition
router.post('/requisitions/:id/approve', async (req, res) => {
  const requisitionId = req.params.id;
  const { user_id, role } = req.body;

  try {
    // 1. Fetch requisition with creator details
    const [requisitions] = await db.query(`
      SELECT r.*, u.department as sender_department
      FROM requisitions r
      JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [requisitionId]);

    if (requisitions.length === 0) {
      return res.status(404).json({ success: false, message: 'Requisition not found' });
    }

    const requisition = requisitions[0];
    const dept = requisition.sender_department?.trim().toLowerCase();

    let approvalRules;

    if (dept === 'ict') {
      // ICT department flow
      approvalRules = {
        manager: { field: 'approved_by_manager', dependsOn: null },
        executive: { field: 'approved_by_executive', dependsOn: 'approved_by_manager' },
        finance: { field: 'approved_by_finance', dependsOn: 'approved_by_executive' },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman' }
      };
    } else if (dept === 'finance') {
      // Finance department flow
      approvalRules = {
        finance: { field: 'approved_by_finance', dependsOn: null },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman' }
      };
    } else {
      // All other departments
      approvalRules = {
        finance: { field: 'approved_by_finance', dependsOn: null },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman' }
      };
    }

    // 2. Validate role
    if (!approvalRules[role]) {
      return res.status(400).json({ success: false, message: 'Invalid approval role' });
    }

    const { field, dependsOn } = approvalRules[role];

    // 3. Check dependency
    if (dependsOn && requisition[dependsOn] !== 1) {
      return res.status(403).json({
        success: false,
        message: `Requires ${dependsOn.replace('approved_by_', '')} approval first`
      });
    }

    // 4. Update DB
    await db.query(`
      UPDATE requisitions 
      SET ${field} = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [requisitionId]);

    return res.json({
      success: true,
      message: `${role} approval successful`
    });

  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Reject requisition
router.post('/requisitions/:id/reject', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to reject requisition' });
    }

    // Get user role + department
    const [userResults] = await db.query(
      'SELECT role, department FROM users WHERE id = ?',
      [userId]
    );
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role?.toLowerCase();
    const dept = userResults[0].department?.trim().toLowerCase();

    // Define approval flow per department
    let approvalRules;
    if (dept === 'ict') {
      approvalRules = {
        manager: { field: 'approved_by_manager', dependsOn: null },
        executive: { field: 'approved_by_executive', dependsOn: 'approved_by_manager' },
        finance: { field: 'approved_by_finance', dependsOn: 'approved_by_executive' },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman' }
      };
    } else if (dept === 'finance') {
      approvalRules = {
        finance: { field: 'approved_by_finance', dependsOn: null },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman'}
      };
    } else {
      // All other departments
      approvalRules = {
        finance: { field: 'approved_by_finance', dependsOn: null },
        gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_finance' },
        chairman: { field: 'approved_by_chairman'}
      };
    }

    if (!approvalRules[role]) {
      return res.status(403).json({ message: 'User role not authorized to reject requisitions' });
    }

    const { field, dependsOn } = approvalRules[role];

    // Get current requisition to validate order
    const [reqRows] = await db.query(
      'SELECT * FROM requisitions WHERE id = ?',
      [requisitionId]
    );
    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }
    const requisition = reqRows[0];

    // Check if the previous step was approved (if any)
    if (dependsOn && requisition[dependsOn] !== 1) {
      return res.status(403).json({
        message: `Cannot reject — waiting for ${dependsOn.replace('approved_by_', '')} action first`
      });
    }

    // Perform rejection
    await db.query(
      `UPDATE requisitions 
       SET ${field} = -1, status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [requisitionId]
    );

    return res.status(200).json({
      success: true,
      message: `${role} rejected the requisition.`,
      field
    });

  } catch (err) {
    console.error('❌ Error rejecting requisition:', err);
    return res.status(500).json({ message: 'Error rejecting requisition' });
  }
});


// Helper functions
function getNextApprover(currentRole, isFinanceDepartment) {
  const flow = isFinanceDepartment
    ? ['finance', 'gmd', 'chairman']
    : ['manager', 'executive', 'finance', 'gmd', 'chairman'];

  const currentIndex = flow.indexOf(currentRole);
  return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
}

function getUpdatedStatus(role, isFinanceDepartment) {
  if (role === 'chairman') return 'approved';
  if (role === 'gmd') return 'pending_chairman';
  if (role === 'finance' && isFinanceDepartment) return 'pending_gmd';
  if (role === 'executive') return 'pending_finance';
  if (role === 'manager') return 'pending_executive';
  return 'in_review';
}

function getApprovalFlow(isFinanceDepartment) {
  return isFinanceDepartment
    ? ['finance', 'gmd', 'chairman']
    : ['manager', 'executive', 'finance', 'gmd', 'chairman'];
}
// Pay endpoint for finance
router.post('/requisitions/:id/pay', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const { user_id } = req.body;

    // Verify user is finance
    const [userRows] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0 || userRows[0].role.toLowerCase() !== 'finance') {
      return res.status(403).json({ message: 'Only finance users can process payments' });
    }

    // Verify requisition exists and is approved by chairman
    const [reqRows] = await db.query(
      'SELECT * FROM requisitions WHERE id = ? AND approved_by_chairman = 1',
      [requisitionId]
    );
    
    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or not approved by chairman' });
    }

    // Update status to completed
    await db.query(
      'UPDATE requisitions SET status = "completed" WHERE id = ?',
      [requisitionId]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Payment processed successfully' 
    });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ message: 'Error processing payment' });
  }
});

// GET comments for a requisition
router.get('/requisitions/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, u.name as user_name 
      FROM requisition_comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.requisition_id = ? 
      ORDER BY c.created_at ASC
    `, [id]);
    
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// POST a new comment
router.post('/requisitions/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, user_id } = req.body;
    
    if (!comment || !user_id) {
      return res.status(400).json({ message: 'Comment and user ID are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO requisition_comments (requisition_id, user_id, comment) VALUES (?, ?, ?)',
      [id, user_id, comment]
    );
    
    // Get the newly created comment with user name
    const [newComment] = await db.execute(`
      SELECT c.*, u.name as user_name 
      FROM requisition_comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment' });
  }
}); 
// Add this new route to your requisitions router (after your existing routes)

// Get count of pending requisitions for a specific user
router.get('/requisitions/count/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    console.log(`📊 Fetching pending requisition count for user ${userId} with role ${role}`);

    const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];
    let query;
    let values;

    // Get user's department and actual role from DB
    const [userRows] = await db.query(
      `SELECT department, role FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { department, role: actualRole } = userRows[0];
    const userRole = actualRole.toLowerCase();
    let normalizedRole = role?.toLowerCase();

    // OVERRIDE role if dept ≠ ICT and actual role is finance
    if (department.toLowerCase() !== 'ict' && userRole === 'finance') {
      normalizedRole = 'finance';
    }

    // If no role specified or role is not an approval role, count user's own pending requisitions
    if (!normalizedRole || !approvalRoles.includes(normalizedRole)) {
      query = `
        SELECT COUNT(*) as count
        FROM requisitions r
        WHERE r.created_by = ?
        AND r.status != 'completed'
        AND r.status != 'rejected'
        AND (
          r.approved_by_manager IS NULL 
          OR r.approved_by_executive IS NULL 
          OR r.approved_by_finance IS NULL 
          OR r.approved_by_gmd IS NULL 
          OR r.approved_by_chairman IS NULL
        )
      `;
      values = [userId];
    } else {
      // For approvers, count requisitions they need to approve (pending for their level)
      const approvalField = `approved_by_${normalizedRole}`;
      const noDeptRoles = ['finance', 'gmd', 'chairman'];

      if (noDeptRoles.includes(normalizedRole)) {
        // For roles without department restrictions (finance, gmd, chairman)
        let additionalCondition = '';
        if (normalizedRole === 'chairman') {
          additionalCondition = 'AND approved_by_gmd = 1';
        }

        query = `
          SELECT COUNT(*) as count
          FROM requisitions r
          JOIN users u ON r.created_by = u.id
          WHERE ${approvalField} IS NULL
          AND r.status != 'completed'
          AND r.status != 'rejected'
          ${additionalCondition}
        `;
        values = [];
      } else {
        // For department-restricted roles (manager, executive)
        query = `
          SELECT COUNT(*) as count
          FROM requisitions r
          JOIN users u ON r.created_by = u.id
          WHERE ${approvalField} IS NULL
          AND u.department = ?
          AND r.status != 'completed'
          AND r.status != 'rejected'
        `;
        values = [department];
      }
    }

    const [result] = await db.query(query, values);
    const count = result[0]?.count || 0;

    res.json({ 
      success: true, 
      count: count,
      user_role: normalizedRole || 'employee',
      department: department
    });

  } catch (err) {
    console.error('❌ Error fetching pending requisition count:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: err.message 
    });
  }
});

// Pay endpoint for finance 
router.post('/requisitions/:id/pay', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const { user_id } = req.body;

    // Verify user is finance
    const [userRows] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0 || userRows[0].role.toLowerCase() !== 'finance') {
      return res.status(403).json({ message: 'Only finance users can process payments' });
    }

    // Verify requisition exists and is approved by chairman
    const [reqRows] = await db.query(
      'SELECT * FROM requisitions WHERE id = ? AND approved_by_chairman = 1',
      [requisitionId]
    );
    
    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or not approved by chairman' });
    }

    // Update status to completed
    await db.query(
      'UPDATE requisitions SET status = "completed" WHERE id = ?',
      [requisitionId]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Payment processed successfully' 
    });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ message: 'Error processing payment' });
  }
});

// Mark requisition as paid by finance
router.post('/requisitions/:id/mark-paid', async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const { user_id } = req.body;

    // Verify user is finance
    const [userRows] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0 || userRows[0].role.toLowerCase() !== 'finance') {
      return res.status(403).json({ message: 'Only finance users can mark requisitions as paid' });
    }

    // Update paid_by_finance flag
    await db.query(
      'UPDATE requisitions SET paid_by_finance = 1 WHERE id = ?',
      [requisitionId]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Requisition marked as paid successfully' 
    });
  } catch (err) {
    console.error('Error marking requisition as paid:', err);
    res.status(500).json({ message: 'Error marking requisition as paid' });
  }
});
module.exports = router;