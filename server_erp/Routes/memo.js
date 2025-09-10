const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'uploads/memos')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})


// File filter (same as original allowed types)
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
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type'), false)
  }
}

// Initialize multer with same limits as frontend (10MB)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
})

// Error handling middleware for multer - ADD THIS FUNCTION
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size is 10MB.' 
      });
    }
    // Handle other multer errors
    return res.status(400).json({ 
      success: false,
      message: `File upload error: ${error.message}` 
    });
  } else if (error.message === 'Invalid file type') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid file type. Only documents, PDFs, images, and text files are allowed.' 
    });
  }
  
  // For any other errors
  next(error);
};

router.post('/memos', upload.array('files'), handleMulterError, async (req, res) => {
  let uploadedFiles = req.files || [];
  
  try {
    const {
      title,
      content,
      priority = 'medium',
      memo_type = 'normal',
      requires_approval = 1,
      created_by,
      report_data = '{}'
    } = req.body;

    // Parse report_data safely
    let reportType = null;
    let reportDate = null;
    let attachments = null;
    let acknowledgments = [];
    
    if (memo_type === 'report') {
      try {
        const reportData = typeof report_data === 'string' ? JSON.parse(report_data) : report_data;
        reportType = reportData.reportType || null;
        reportDate = reportData.reportDate || null;
        attachments = reportData.attachments || null;
        acknowledgments = reportData.acknowledgments || [];
      } catch (parseError) {
        console.error('Error parsing report_data:', parseError);
        // Continue with default values if parsing fails
      }
    }

    // Process uploaded files
    const fileAttachments = uploadedFiles.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path, // Keep this uncommented - you'll need it to access the file later
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    // Insert into database
    const [result] = await db.execute(
      `INSERT INTO memos 
        (title, content, priority, memo_type, requires_approval, created_by,
         report_type, report_date, attachments, acknowledgments, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        priority,
        memo_type,
        requires_approval ? 1 : 0,
        created_by,
        reportType,
        reportDate,
        JSON.stringify(fileAttachments),
        JSON.stringify(acknowledgments),
        'submitted'
      ]
    );

    res.status(201).json({
      message: 'Memo created successfully',
      memo_id: result.insertId,
      memo_type,
      attachments: fileAttachments
    });

  } catch (err) {
    console.error('Error creating memo:', err.message);

    // Clean up uploaded files on error
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    }

    res.status(500).json({
      message: err.message || 'Internal server error'
    });
  }
});


// GET all memos with complete information
router.get('/memos', async (req, res) => {
  try {
    // First, let's check what columns exist in the users table
    // For now, let's just get the memo data without user joins
    const [memos] = await db.execute(`
      SELECT 
        m.*
      FROM memos m
      ORDER BY m.created_at DESC
    `);

    // Process each memo to include full file URLs and parsed JSON fields
    const memosWithDetails = memos.map(memo => {
      // Parse attachments if they exist
      let attachments = [];
      try {
        if (memo.attachments && memo.attachments !== 'null' && memo.attachments !== '') {
          attachments = JSON.parse(memo.attachments).map(attachment => ({
            ...attachment,
            downloadUrl: `/api/memos/download/${memo.id}/${attachment.filename}`,
            viewUrl: `/api/memos/view/${memo.id}/${attachment.filename}`,
            absolutePath: path.join(__dirname, '../../uploads/memos', attachment.filename)
          }));
        }
      } catch (error) {
        console.error('Error parsing attachments for memo:', memo.id, error);
        attachments = [];
      }

      // Parse acknowledgments if they exist
      let acknowledgments = [];
      try {
        if (memo.acknowledgments && memo.acknowledgments !== 'null' && memo.acknowledgments !== '') {
          acknowledgments = JSON.parse(memo.acknowledgments);
        }
      } catch (error) {
        console.error('Error parsing acknowledgments for memo:', memo.id, error);
        acknowledgments = [];
      }

      // Calculate approval status
      const approvalStatus = {
        manager: memo.approved_by_manager ? 'approved' : memo.rejected_by_manager ? 'rejected' : 'pending',
        executive: memo.approved_by_executive ? 'approved' : memo.rejected_by_executive ? 'rejected' : 'pending',
        finance: memo.approved_by_finance ? 'approved' : memo.rejected_by_finance ? 'rejected' : 'pending',
        gmd: memo.approved_by_gmd ? 'approved' : memo.rejected_by_gmd ? 'rejected' : 'pending',
        chairman: memo.approved_by_chairman ? 'approved' : memo.rejected_by_chairman ? 'rejected' : 'pending'
      };

      // Determine overall status based on individual approvals
      const allApproved = memo.approved_by_manager && memo.approved_by_executive && 
                         memo.approved_by_finance && memo.approved_by_gmd && 
                         memo.approved_by_chairman;
      
      const anyRejected = memo.rejected_by_manager || memo.rejected_by_executive || 
                         memo.rejected_by_finance || memo.rejected_by_gmd || 
                         memo.rejected_by_chairman;

      const overallStatus = allApproved ? 'approved' : anyRejected ? 'rejected' : memo.status;

      return {
        id: memo.id,
        title: memo.title,
        content: memo.content,
        priority: memo.priority,
        memo_type: memo.memo_type,
        requires_approval: Boolean(memo.requires_approval),
        created_by: memo.created_by, // Just return the ID for now
        sender_role: memo.sender_role,
        sender_department: memo.sender_department,
        report_type: memo.report_type,
        report_date: memo.report_date,
        attachments: attachments,
        acknowledgments: acknowledgments,
        status: overallStatus,
        approval_status: approvalStatus,
        individual_approvals: {
          manager: {
            approved: Boolean(memo.approved_by_manager),
            rejected: Boolean(memo.rejected_by_manager)
          },
          executive: {
            approved: Boolean(memo.approved_by_executive),
            rejected: Boolean(memo.rejected_by_executive)
          },
          finance: {
            approved: Boolean(memo.approved_by_finance),
            rejected: Boolean(memo.rejected_by_finance)
          },
          gmd: {
            approved: Boolean(memo.approved_by_gmd),
            rejected: Boolean(memo.rejected_by_gmd)
          },
          chairman: {
            approved: Boolean(memo.approved_by_chairman),
            rejected: Boolean(memo.rejected_by_chairman)
          }
        },
        created_at: memo.created_at,
        updated_at: memo.updated_at,
        uploads_directory: path.join(__dirname, '../../uploads/memos')
      };
    });

    res.status(200).json({
      success: true,
      count: memosWithDetails.length,
      data: memosWithDetails,
      uploads_base_path: path.join(__dirname, '../../uploads/memos')
    });

  } catch (err) {
    console.error('Error fetching memos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// router.post('/memos', upload.array('files'), async (req, res) => {
//   try {
//     const {
//       title,
//       content,
//       priority = 'medium',
//       memo_type = 'normal',
//       requires_approval = 1,
//       created_by,
//       report_data = {}
//     } = req.body

//     const {
//       reportType = null,
//       reportDate = null,
//       attachments = null,
//       acknowledgments = []
//     } = memo_type === 'report' ? JSON.parse(report_data) : {}

//     // Process uploaded files
//     const fileAttachments = req.files?.map(file => ({
//       filename: file.filename,
//       originalname: file.originalname,
//      // path: file.path,
//       size: file.size,
//       mimetype: file.mimetype
//     })) || []

//     // Rest of your original memo creation logic
//     const [result] = await db.execute(
//       `INSERT INTO memos 
//         (title, content, priority, memo_type, requires_approval, created_by,
//          report_type, report_date, attachments, acknowledgments, status) 
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         title,
//         content,
//         priority,
//         memo_type,
//         requires_approval ? 1 : 0,
//         created_by,
//         reportType,
//         reportDate,
//         JSON.stringify(fileAttachments),
//         JSON.stringify(acknowledgments),
//         'submitted'
//       ]
//     )

//     res.status(201).json({
//       message: 'Memo created successfully',
//       memo_id: result.insertId,
//       memo_type
//     })

//   } catch (err) {
//     console.error('Error creating memo:', err.message)

//     // Clean up uploaded files on error
//     if (req.files?.length) {
//       req.files.forEach(file => {
//         fs.unlink(file.path, () => { })
//       })
//     }

//     res.status(500).json({
//       message: err.message || 'Internal server error'
//     })
//   }
// })


// Serve uploaded files
// Serve uploaded files - FIXED VERSION
router.get('/uploads/memos/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/memos', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  // Set proper headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// router.get('/uploads/memos/:filename', (req, res) => {
//   const filePath = path.join(__dirname, '../../uploads/memos', req.params.filename);

//   if (fs.existsSync(filePath)) {
//     res.sendFile(filePath);
//   } else {
//     res.status(404).json({ message: 'File not found' });
//   }
// });


// GET /memos - fetch all memos
// GET /api/memos - Fetch all memos
// Serve memo attachments
router.get('/uploads/memos/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', 'memos', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  // Set proper headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// GET /memos/user/:userId - fetch memos for specific user based on role
// router.get('/memos/user/:userId', async (req, res) => {
//   const { userId } = req.params;
//   const { role } = req.query;

//   const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];
//   const normalizedRole = role?.toLowerCase();

//   try {
//     let query = '';
//     let values = [];

//     if (normalizedRole && approvalRoles.includes(normalizedRole)) {
//       const approvalField = `approved_by_${normalizedRole}`;

//       // Roles with NO department restriction
//       const noDeptRoles = ['finance', 'gmd', 'chairman'];

//       if (noDeptRoles.includes(normalizedRole)) {
//         query = `
//           SELECT m.*
//           FROM memos m
//           WHERE (
//             (m.memo_type = 'normal' AND ${approvalField} IS NULL AND m.requires_approval = 1
//               ${normalizedRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
//             )
//             OR (
//               m.memo_type = 'report' AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
//             )
//             OR m.created_by = ?
//           )
//           ORDER BY m.created_at DESC
//         `;
//         values = [userId];
//       } else {
//         // Roles WITH department restriction (manager, executive)
//         const [userRows] = await db.query(`SELECT department FROM users WHERE id = ?`, [userId]);

//         if (userRows.length === 0) {
//           return res.status(404).json({ message: 'User not found' });
//         }

//         const userDept = userRows[0].department;

//         query = `
//           SELECT m.*
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE (
//             m.created_by = ?
//             OR (
//               m.memo_type = 'normal'
//               AND ${approvalField} IS NULL
//               AND m.requires_approval = 1
//               AND u.department = ?
//             )
//             OR (
//               m.memo_type = 'report'
//               AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
//               AND u.department = ?
//             )
//           )
//           ORDER BY m.created_at DESC
//         `;
//         values = [userId, userDept, userDept];
//       }
//     } else {
//       // Fallback: show user's own memos
//       query = `
//         SELECT * FROM memos
//         WHERE created_by = ?
//         ORDER BY created_at DESC
//       `;
//       values = [userId];
//     }

//     const [rows] = await db.query(query, values);

//     // Parse acknowledgment JSON
//     rows.forEach(memo => {
//       if (memo.acknowledgments) {
//         try {
//           memo.acknowledgments = JSON.parse(memo.acknowledgments);
//         } catch (e) {
//           console.warn(`⚠️ Failed to parse acknowledgments for memo ID ${memo.id}`);
//           memo.acknowledgments = [];
//         }
//       }
//     });

//     res.status(200).json(rows);
//   } catch (error) {
//     console.error('❌ Error fetching memos for user and role:', error);
//     res.status(500).json({ message: 'Server error while fetching user memos' });
//   }
// });


// GET /memos/user/:userId - fetch memos for specific user based on role
// router.get('/memos/user/:userId', async (req, res) => {
//   const { userId } = req.params;
//   let { role } = req.query;

//   const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];

//   try {
//     // 🔸 Get user's department and actual role from DB
//     const [userRows] = await db.query(`SELECT department, role FROM users WHERE id = ?`, [userId]);

//     if (userRows.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const { department, role: actualRole } = userRows[0];

//     // 🔸 Normalize role
//     let normalizedRole = role?.toLowerCase();

//     // 🔸 OVERRIDE role if dept ≠ ICT and actual role is finance
//     if (department.toLowerCase() !== 'ict' && actualRole.toLowerCase() === 'finance') {
//       normalizedRole = 'finance';
//     }

//     let query = '';
//     let values = [];

//     if (normalizedRole && approvalRoles.includes(normalizedRole)) {
//       const approvalField = `approved_by_${normalizedRole}`;

//       const noDeptRoles = ['finance', 'gmd', 'chairman'];

//       if (noDeptRoles.includes(normalizedRole)) {
//         query = `
//           SELECT m.*
//           FROM memos m
//           WHERE (
//             (m.memo_type = 'normal' AND ${approvalField} IS NULL AND m.requires_approval = 1
//               ${normalizedRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
//             )
//             OR (
//               m.memo_type = 'report' AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
//             )
//             OR m.created_by = ?
//           )
//           ORDER BY m.created_at DESC
//         `;
//         values = [userId];
//       } else {
//         // Dept-restricted roles: manager, executive
//         query = `
//           SELECT m.*
//           FROM memos m
//           JOIN users u ON m.created_by = u.id
//           WHERE (
//             m.created_by = ?
//             OR (
//               m.memo_type = 'normal'
//               AND ${approvalField} IS NULL
//               AND m.requires_approval = 1
//               AND u.department = ?
//             )
//             OR (
//               m.memo_type = 'report'
//               AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
//               AND u.department = ?
//             )
//           )
//           ORDER BY m.created_at DESC
//         `;
//         values = [userId, department, department];
//       }
//     } else {
//       // Fallback to user's own memos
//       query = `
//         SELECT * FROM memos
//         WHERE created_by = ?
//         ORDER BY created_at DESC
//       `;
//       values = [userId];
//     }

//     const [rows] = await db.query(query, values);

//     // Parse JSON acknowledgments
//     rows.forEach(memo => {
//       if (memo.acknowledgments) {
//         try {
//           memo.acknowledgments = JSON.parse(memo.acknowledgments);
//         } catch (e) {
//           console.warn(`⚠️ Failed to parse acknowledgments for memo ID ${memo.id}`);
//           memo.acknowledgments = [];
//         }
//       }
//     });

//     res.status(200).json(rows);
//   } catch (error) {
//     console.error('❌ Error fetching memos for user and role:', error);
//     res.status(500).json({ message: 'Server error while fetching user memos' });
//   }
// });


router.get('/memos/user/:userId', async (req, res) => {
  const { userId } = req.params;
  let { role, status } = req.query;

  const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];

  try {
    // Get user's department and actual role from DB
    const [userRows] = await db.query(`SELECT department, role FROM users WHERE id = ?`, [userId]);

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
        m.*, 
        u.role AS sender_role, 
        u.department AS sender_department,
        m.approved_by_manager AS manager_approved,
        m.approved_by_executive AS executive_approved,
        m.approved_by_finance AS finance_approved,
        m.approved_by_gmd AS gmd_approved,
        m.approved_by_chairman AS chairman_approved
      FROM memos m
      JOIN users u ON m.created_by = u.id
    `;

    let query = '';
    let values = [];

    // If no role specified or role is not an approval role, just get user's own memos
    if (!normalizedRole || !approvalRoles.includes(normalizedRole)) {
      let statusCondition = '';
      if (status === 'approved') {
        statusCondition = 'AND (m.approved_by_manager = 1 OR m.approved_by_executive = 1 OR m.approved_by_finance = 1 OR m.approved_by_gmd = 1 OR m.approved_by_chairman = 1)';
      } else if (status === 'pending') {
        statusCondition = 'AND m.requires_approval = 1 AND (m.approved_by_manager IS NULL OR m.approved_by_executive IS NULL OR m.approved_by_finance IS NULL OR m.approved_by_gmd IS NULL OR m.approved_by_chairman IS NULL)';
      }

      query = `
        ${baseSelect}
        WHERE m.created_by = ?
        ${statusCondition}
        ORDER BY m.created_at DESC
      `;
      values = [userId];
    } else {
      // For approvers, get memos they need to approve + memos they've approved + their own memos
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
            m.created_by = ?
            OR (
              m.memo_type = 'normal' 
              AND m.requires_approval = 1
              ${normalizedRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
              ${pendingCondition}
              ${approvedCondition}
            )
            OR (
              m.memo_type = 'report'
              AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
              ${pendingCondition}
              ${approvedCondition}
            )
            OR ${approvalField} = 1  /* Memos this role has already approved */
          )
          ORDER BY m.created_at DESC
        `;
        values = [userId];
      } else {
        // For department-restricted roles (manager, executive)
        query = `
          ${baseSelect}
          WHERE (
            m.created_by = ?
            OR (
              m.memo_type = 'normal'
              AND m.requires_approval = 1
              AND u.department = ?
              ${pendingCondition}
              ${approvedCondition}
            )
            OR (
              m.memo_type = 'report'
              AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
              AND u.department = ?
              ${pendingCondition}
              ${approvedCondition}
            )
            OR ${approvalField} = 1  /* Memos this role has already approved */
          )
          ORDER BY m.created_at DESC
        `;
        values = [userId, department, department];
      }
    }

    const [rows] = await db.query(query, values);

    // Parse JSON acknowledgments and add approval status summary
    rows.forEach(memo => {
      if (memo.acknowledgments) {
        try {
          memo.acknowledgments = JSON.parse(memo.acknowledgments);
        } catch (e) {
          console.warn(`⚠️ Failed to parse acknowledgments for memo ID ${memo.id}`);
          memo.acknowledgments = [];
        }
      }

      // Add overall approval status
      memo.approval_status = 'pending';
      if (memo.approved_by_chairman) {
        memo.approval_status = 'fully_approved';
      } else if (memo.approved_by_gmd) {
        memo.approval_status = 'gmd_approved';
      } else if (memo.approved_by_finance) {
        memo.approval_status = 'finance_approved';
      } else if (memo.approved_by_executive) {
        memo.approval_status = 'executive_approved';
      } else if (memo.approved_by_manager) {
        memo.approval_status = 'manager_approved';
      }
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error fetching memos for user and role:', error);
    res.status(500).json({ message: 'Server error while fetching user memos' });
  }
});


//fro memo count logic 

router.get('/memos/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    // First get full user info
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    const userRole = role?.toLowerCase() || user.role.toLowerCase();
    const department = user.department;

    const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];
    const isApprover = approvalRoles.includes(userRole);

    let query = '';
    let params = [];

    if (isApprover) {
      const approvalField = `approved_by_${userRole}`;

      if (['finance', 'gmd', 'chairman'].includes(userRole)) {
        // Global approvers (no department restriction)
        query = `
          SELECT COUNT(*) as count
          FROM memos
          WHERE (
            (memo_type = 'normal' AND ${approvalField} IS NULL AND requires_approval = 1)
            OR
            (memo_type = 'report' AND JSON_CONTAINS(acknowledgments, JSON_QUOTE(?)))
          )
          ${userRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
        `;
        params = [userRole];
      } else {
        // Department-restricted approvers (manager/executive)
        query = `
          SELECT COUNT(*) as count
          FROM memos m
          JOIN users u ON m.created_by = u.id
          WHERE (
            (m.memo_type = 'normal' AND m.${approvalField} IS NULL AND m.requires_approval = 1 AND u.department = ?)
            OR
            (m.memo_type = 'report' AND JSON_CONTAINS(m.acknowledgments, JSON_QUOTE(?)) AND u.department = ?)
          )
        `;
        params = [department, userRole, department];
      }
    } else {
      // Regular users - only their own memos
      query = `
        SELECT COUNT(*) as count 
        FROM memos 
        WHERE created_by = ?
      `;
      params = [userId];
    }

    const [rows] = await db.query(query, params);
    const count = rows[0]?.count || 0;

    res.json({ count });

  } catch (err) {
    console.error('Error fetching memo counts:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});


router.post('/memos/:id/acknowledge', async (req, res) => {
  const memoId = req.params.id;
  const { user_id } = req.body;

  try {
    // Get memo and sender info
    const [memoRows] = await db.execute(`
      SELECT acknowledgments, created_by, u.role AS sender_role, u.department AS sender_dept
      FROM memos
      JOIN users u ON memos.created_by = u.id
      WHERE memos.id = ?
    `, [memoId]);

    if (memoRows.length === 0) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    const memo = memoRows[0];
    let acknowledgments = [];

    if (memo.acknowledgments) {
      try {
        acknowledgments = JSON.parse(memo.acknowledgments);
      } catch (e) {
        console.error('❌ Failed to parse acknowledgments:', e.message);
        // fallback to empty
      }
    }

    // Prevent self-acknowledgment
    if (memo.created_by === user_id) {
      return res.status(400).json({ message: 'You cannot acknowledge your own memo' });
    }

    // Prevent duplicates
    const alreadyAcknowledged = acknowledgments.some(user => user.id === user_id);
    if (alreadyAcknowledged) {
      return res.status(400).json({ message: 'You have already acknowledged this memo' });
    }

    // Get acknowledger info
    const [userRows] = await db.execute(
      'SELECT id, name, role, department FROM users WHERE id = ?',
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Build acknowledgment record
    const newAck = {
      id: user.id,
      name: user.name,
      role: user.role,
      dept: user.department,
      acknowledging_sender: {
        id: memo.created_by,
        role: memo.sender_role,
        dept: memo.sender_dept
      }
    };

    acknowledgments.push(newAck);

    // Update DB
    await db.execute(
      'UPDATE memos SET acknowledgments = ? WHERE id = ?',
      [JSON.stringify(acknowledgments), memoId]
    );

    res.status(200).json({
      message: 'Acknowledgment recorded successfully',
      acknowledgments
    });
  } catch (err) {
    console.error('❌ Error in acknowledgment route:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// GET /memos/:id - fetch a specific memo by ID
router.get('/memos/:id', async (req, res) => {
  const memoId = parseInt(req.params.id, 10);

  try {
    const [rows] = await db.query('SELECT * FROM memos WHERE id = ?', [memoId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching memo:', error);
    res.status(500).json({ success: false, message: 'Server error fetching memo' });
  }
});



// POST /memos/:id/approve - approve memo based on user role
// router.post('/memos/:id/approve', async (req, res) => {
//   const memoId = req.params.id;
//   const { user_id, role } = req.body;

//   const roleApprovalMap = {
//     manager: { field: 'approved_by_manager', dependsOn: null },
//     executive: { field: 'approved_by_executive', dependsOn: 'approved_by_manager' },
//     finance: { field: 'approved_by_finance', dependsOn: 'approved_by_manager' },
//     gmd: { field: 'approved_by_gmd', dependsOn: 'approved_by_manager' },
//     chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd' },
//   };

//   if (!roleApprovalMap[role]) {
//     return res.status(400).json({ success: false, message: 'Invalid role' });
//   }

//   const { field, dependsOn } = roleApprovalMap[role];

//   try {
//     // 1. Fetch the memo
//     const [memos] = await db.query('SELECT * FROM memos WHERE id = ?', [memoId]);

//     if (memos.length === 0) {
//       return res.status(404).json({ success: false, message: 'Memo not found' });
//     }

//     const memo = memos[0];

//     // 2. Check if approval dependency is satisfied
//     if (dependsOn && memo[dependsOn] !== 1) {
//       return res.status(403).json({
//         success: false,
//         message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`,
//       });
//     }

//     // 3. Update approval field
//     const updateQuery = `
//       UPDATE memos 
//       SET ${field} = 1, updated_at = CURRENT_TIMESTAMP 
//       WHERE id = ?
//     `;
//     await db.query(updateQuery, [memoId]);

//     return res.status(200).json({
//       success: true,
//       message: `${role} approved the memo.`,
//       updatedFields: {
//         [field]: 1,
//       },
//     });
//   } catch (err) {
//     console.error('Error approving memo:', err);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });


// router.post('/memos/:id/approve', async (req, res) => {
//   const memoId = req.params.id;
//   const { user_id, role } = req.body;

//   try {
//     // 1. Fetch memo with creator's department and role
//     const [memos] = await db.query(`
//       SELECT m.*, u.department, u.role as creator_role 
//       FROM memos m
//       JOIN users u ON m.created_by = u.id
//       WHERE m.id = ?
//     `, [memoId]);

//     if (memos.length === 0) {
//       return res.status(404).json({ success: false, message: 'Memo not found' });
//     }

//     const memo = memos[0];
// const isFinanceCreator = memo.sender_department?.toLowerCase() === 'finance';
// const isFinanceApprover = role?.toLowerCase() === 'finance';



//     // 2. Define approval rules with Finance exception
//   const approvalRules = {
//   manager: { 
//     field: 'approved_by_manager', 
//     dependsOn: null,
//     skip: isFinanceCreator
//   },
//   executive: { 
//     field: 'approved_by_executive', 
//     dependsOn: 'approved_by_manager',
//     skip: isFinanceCreator
//   },
//   finance: { 
//     field: 'approved_by_finance', 
//     dependsOn: isFinanceCreator ? null : 'approved_by_manager'
//   },
//   gmd: { 
//     field: 'approved_by_gmd', 
//     dependsOn: isFinanceCreator ? 'approved_by_finance' : 'approved_by_manager'
//   },
//   chairman: { 
//     field: 'approved_by_chairman', 
//     dependsOn: 'approved_by_gmd' 
//   }
// };


//     if (!approvalRules[role]) {
//       return res.status(400).json({ success: false, message: 'Invalid role' });
//     }

//     const { field, dependsOn, skip } = approvalRules[role];

//     // 3. Handle skipped steps
//     if (skip) {
//       return res.status(403).json({
//         success: false,
//         message: `This memo skips ${role} approval due to Finance creator rules.`
//       });
//     }

//     // 4. Check dependency
//     if (dependsOn && memo[dependsOn] !== 1) {
//       return res.status(403).json({
//         success: false,
//         message: `Requires ${dependsOn.replace('approved_by_', '')} approval first.`
//       });
//     }

//     // 5. Update approval
//     await db.query(`
//       UPDATE memos 
//       SET ${field} = 1, 
//           updated_at = CURRENT_TIMESTAMP,
//           status = CASE 
//             WHEN ? = 'chairman' THEN 'approved'
//             WHEN ? = 'gmd' THEN 'pending_chairman'
//             ELSE status
//           END
//       WHERE id = ?
//     `, [role, role, memoId]);

//     return res.status(200).json({
//       success: true,
//       message: `${role} approved the memo.`,
//       updatedFields: { [field]: 1 },
//       nextApprover: getNextApprover(role, isFinanceCreator)
//     });

//   } catch (err) {
//     console.error('Error approving memo:', err);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

// // Helper to determine next approver
// function getNextApprover(currentRole, isFinanceCreator) {
//   const flow = isFinanceCreator
//     ? ['finance', 'gmd', 'chairman']  // Finance creator flow
//     : ['manager', 'executive', 'finance', 'gmd', 'chairman']; // Normal flow

//   const currentIndex = flow.indexOf(currentRole);
//   return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
// }


router.post('/memos/:id/approve', async (req, res) => {
  const memoId = req.params.id;
  const { user_id, role } = req.body;

  try {
    // 1. Fetch memo with creator details
    const [memos] = await db.query(`
      SELECT m.*, u.department as sender_department, u.role as sender_role
      FROM memos m
      JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `, [memoId]);

    if (memos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memo not found',
        details: `No memo found with ID: ${memoId}`
      });
    }

    const memo = memos[0];
    const isICTDepartment = memo.sender_department?.toLowerCase() === 'ict';
    const isFinanceDepartment = memo.sender_department?.toLowerCase() === 'finance';

    // 2. Define approval rules
    const approvalRules = {
      manager: {
        field: 'approved_by_manager',
        dependsOn: null,
        allowed: !isFinanceDepartment && memo.requires_approval,
        error: isFinanceDepartment
          ? 'Finance memos skip manager approval'
          : 'Manager approval required'
      },
      executive: {
        field: 'approved_by_executive',
        dependsOn: 'approved_by_manager',
        allowed: !isFinanceDepartment && memo.requires_approval && memo.approved_by_manager === 1,
        error: !memo.approved_by_manager
          ? 'Requires manager approval first'
          : 'Executive approval not permitted'
      },
      finance: {
        field: 'approved_by_finance',
        dependsOn: isICTDepartment ? 'approved_by_executive' : null,
        allowed: memo.requires_approval && 
          (isICTDepartment ? memo.approved_by_executive === 1 : true),
        error: isICTDepartment 
          ? 'Requires executive approval first from cto'
          : 'Finance approval not permitted'
      },
      gmd: {
        field: 'approved_by_gmd',
        allowed: memo.requires_approval &&
          (isFinanceDepartment ? memo.approved_by_finance === 1 : true),
        error: isFinanceDepartment
          ? 'Requires finance approval first'
          : 'GMD approval not permitted'
      },
      chairman: {
        field: 'approved_by_chairman',
        dependsOn: 'approved_by_gmd',
        allowed: memo.requires_approval && memo.approved_by_gmd === 1,
        error: 'Requires GMD approval first'
      }
    };

    // 3. Validate approval attempt
    if (!approvalRules[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval role',
        details: `Role ${role} cannot approve memos`
      });
    }

    const { field, dependsOn, allowed, error } = approvalRules[role];

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Approval not permitted',
        details: error
      });
    }

  // 4. Determine new status - FIXED VERSION
let newStatus = memo.status;
if (role === 'chairman') {
  newStatus = 'approved'; // ✅ Valid
} else if (role === 'gmd') {
  newStatus = 'in_review'; // Changed from invalid 'pending_chairman' to valid 'in_review'
} else if (role === 'finance' && isFinanceDepartment) {
  newStatus = 'in_review'; // Changed from invalid 'pending_gmd' to valid 'in_review'
} else {
  newStatus = 'in_review'; // ✅ Valid
}

    // 5. Update memo
    await db.query(`
      UPDATE memos 
      SET ${field} = 1,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, memoId]);

    // 6. Prepare response
    const response = {
      success: true,
      message: `${role} approval successful`,
      updatedFields: {
        [field]: 1,
        status: newStatus
      },
      nextApprover: getNextApprover(role, isFinanceDepartment)
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error('Approval error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
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
  return 'in_review';
}

function getApprovalFlow(isFinanceDepartment) {
  return isFinanceDepartment
    ? ['finance', 'gmd', 'chairman']
    : ['manager', 'executive', 'finance', 'gmd', 'chairman'];
}


router.post('/memos/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    const [userRows] = await db.query(`SELECT role FROM users WHERE id = ?`, [user_id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userRole = userRows[0].role?.toLowerCase();
    const acknowledgmentRoles = ['manager', 'executive', 'finance'];

    if (!acknowledgmentRoles.includes(userRole)) {
      return res.status(403).json({ message: 'User not allowed to acknowledge this memo' });
    }

    const [memoRows] = await db.query(`SELECT acknowledgments FROM memos WHERE id = ?`, [id]);

    if (memoRows.length === 0) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    const memo = memoRows[0];
    let currentAck = [];

    if (memo.acknowledgments) {
      currentAck = JSON.parse(memo.acknowledgments);
      if (currentAck.includes(user_id)) {
        return res.status(200).json({ message: 'Already acknowledged' });
      }
    }

    currentAck.push(user_id);

    await db.query(`UPDATE memos SET acknowledgments = ? WHERE id = ?`, [
      JSON.stringify(currentAck),
      id,
    ]);

    res.status(200).json({ message: 'Acknowledged successfully' });
  } catch (err) {
    console.error('❌ Acknowledgment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST /memos/:id/reject - reject memo based on user role
router.post('/memos/:id/reject', async (req, res) => {
  try {
    const memoId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to reject memo' });
    }

    const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role?.toLowerCase();

    const roleFieldMap = {
      manager: 'approved_by_manager',
      executive: 'approved_by_executive',
      finance: 'approved_by_finance',
      gmd: 'approved_by_gmd',
      gmd2: 'approved_by_gmd2',
      chairman: 'approved_by_chairman',
    };

    const field = roleFieldMap[role];

    if (!field) {
      return res.status(403).json({ message: 'User role not authorized to reject memos' });
    }

    const updateQuery = `
      UPDATE memos 
      SET ${field} = -1, status = 'rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await db.query(updateQuery, [memoId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    return res.status(200).json({
      success: true,
      message: `${role} rejected the memo.`,
      field,
    });
  } catch (err) {
    console.error('❌ Error rejecting memo:', err);
    return res.status(500).json({ message: 'Error rejecting memo' });
  }
});

// router.post('/memos/:id/reject', async (req, res) => {
//   try {
//     const memoId = req.params.id;
//     const { userId } = req.body;

//     if (!userId) {
//       return res.status(400).json({ message: 'User ID is required to reject memo' });
//     }

//     const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);

//     if (userResults.length === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const role = userResults[0].role;

//     const roleFieldMap = {
//       manager: 'approved_by_manager',
//       executive: 'approved_by_executive',
//       finance: 'approved_by_finance',
//       gmd: 'approved_by_gmd',
//       gmd2: 'approved_by_gmd2',
//       chairman: 'approved_by_chairman',
//     };


//     const field = roleFieldMap[role];

//     if (!field) {
//       return res.status(403).json({ message: 'User role not authorized to reject memos' });
//     }

//     const updateQuery = `
//   UPDATE memos 
//   SET ${field} = -1, status = 'rejected', updated_at = CURRENT_TIMESTAMP 
//   WHERE id = ?
// `;


//     const [result] = await db.query(updateQuery, [memoId]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Memo not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `${role} rejected the memo.`,
//       field,
//     });
//   } catch (err) {
//     console.error('Error rejecting memo:', err);
//     return res.status(500).json({ message: 'Error rejecting memo' });
//   }
// });

// DELETE /memos/:id - delete memo

router.delete('/memos/:id', async (req, res) => {
  try {
    const memoId = req.params.id;

    const deleteMemoSql = 'DELETE FROM memos WHERE id = ?';
    const [result] = await db.query(deleteMemoSql, [memoId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    res.status(200).json({ message: 'Memo deleted successfully' });
  } catch (err) {
    console.error('Error deleting memo:', err);
    return res.status(500).json({ message: 'Error deleting memo' });
  }
});

// GET /memos/approval/:userId - get memos pending approval for specific user
router.get('/memos/approval/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const getUserRoleSql = 'SELECT role FROM users WHERE id = ?';
    const [userResults] = await db.query(getUserRoleSql, [userId]);

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const role = userResults[0].role;

    let whereClause = '';
    switch (role) {
      case 'gmd':
        whereClause = 'approved_by_gmd = 0';
        break;
      case 'finance':
        whereClause = 'approved_by_gmd = 1 AND approved_by_finance = 0';
        break;
      case 'gmd2':
        whereClause = 'approved_by_finance = 1 AND approved_by_gmd2 = 0';
        break;
      case 'chairman':
        whereClause = 'approved_by_gmd2 = 1 AND approved_by_chairman = 0';
        break;
      default:
        return res.status(403).json({ message: 'User role not authorized to view memos for approval' });
    }

    const getMemosSql = `SELECT * FROM memos WHERE ${whereClause}`;
    const [memoResults] = await db.query(getMemosSql);

    res.status(200).json(memoResults);
  } catch (err) {
    console.error('Error fetching memos for approval:', err);
    return res.status(500).json({ message: 'Error fetching memos for approval' });
  }
});


// GET comments for a memo
router.get('/memos/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [comments] = await db.execute(`
      SELECT c.*, u.name as user_name 
      FROM memo_comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.memo_id = ? 
      ORDER BY c.created_at ASC
    `, [id]);
    
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// POST a new comment for a memo
router.post('/memos/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, user_id } = req.body;
    
    if (!comment || !user_id) {
      return res.status(400).json({ message: 'Comment and user ID are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO memo_comments (memo_id, user_id, comment) VALUES (?, ?, ?)',
      [id, user_id, comment]
    );
    
    // Get the newly created comment with user name
    const [newComment] = await db.execute(`
      SELECT c.*, u.name as user_name 
      FROM memo_comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Pay endpoint for finance (memos)
router.post('/memos/:id/pay', async (req, res) => {
  try {
    const memoId = req.params.id;
    const { user_id } = req.body;

    // Verify user is finance
    const [userRows] = await db.query(
      'SELECT role FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0 || userRows[0].role.toLowerCase() !== 'finance') {
      return res.status(403).json({ message: 'Only finance users can process payments' });
    }

    // Verify memo exists and is approved by chairman
    const [memoRows] = await db.query(
      'SELECT * FROM memos WHERE id = ? AND approved_by_chairman = 1',
      [memoId]
    );
    
    if (memoRows.length === 0) {
      return res.status(404).json({ message: 'Memo not found or not approved by chairman' });
    }

    // Update status to completed
    await db.query(
      'UPDATE memos SET status = "completed" WHERE id = ?',
      [memoId]
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






module.exports = router;