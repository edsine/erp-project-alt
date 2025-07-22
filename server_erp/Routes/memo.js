const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new memo
// Create new memo
// router.post('/memos', async (req, res) => {
//   try {
//     const {
//       title,
//       content,
//       priority = 'medium',
//       memo_type = 'normal',
//       requires_approval = 1,
//       created_by,
//       report_data = {}
//     } = req.body;

//     const {
//       reportType = null,
//       reportDate = null,
//       attachments = null,
//       acknowledgments = []
//     } = memo_type === 'report' ? report_data : {};

//     // ✅ Sanitize: only keep string role names (e.g., "manager")
//     const cleanAcknowledgments = Array.isArray(acknowledgments)
//       ? acknowledgments.filter(a => typeof a === 'string')
//       : [];

//     const acknowledgmentString = cleanAcknowledgments.length > 0
//       ? JSON.stringify(cleanAcknowledgments)
//       : null;

//     const [result] = await db.execute(
//       `INSERT INTO memos 
//         (title, content, priority, memo_type, requires_approval, created_by, report_type, report_date, attachments, acknowledgments, status) 
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
//         attachments,
//         acknowledgmentString,
//         'submitted'
//       ]
//     );

//     res.status(201).json({ message: 'Memo created successfully', memo_id: result.insertId, memo_type });
//   } catch (err) {
//     console.error('❌ Error creating memo:', err.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.post('/memos', async (req, res) => {
  try {
    const {
      title,
      content,
      priority = 'medium',
      memo_type = 'normal',
      requires_approval = 1,
      created_by,
      report_data = {}
    } = req.body;

    const {
      reportType = null,
      reportDate = null,
      attachments = null,
      acknowledgments = []
    } = memo_type === 'report' ? report_data : {};

    // ✅ Sanitize acknowledgments
    const cleanAcknowledgments = Array.isArray(acknowledgments)
      ? acknowledgments.filter(a => typeof a === 'string')
      : [];

    const acknowledgmentString = cleanAcknowledgments.length > 0
      ? JSON.stringify(cleanAcknowledgments)
      : null;

    // ✅ Fetch sender role & department
    const [[user]] = await db.query(
      'SELECT role, department FROM users WHERE id = ?',
      [created_by]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const sender_role = user.role;
    const sender_department = user.department;

    // ✅ Insert memo including sender_role and sender_department
    const [result] = await db.execute(
      `INSERT INTO memos 
        (title, content, priority, memo_type, requires_approval, created_by, sender_role, sender_department,
         report_type, report_date, attachments, acknowledgments, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        priority,
        memo_type,
        requires_approval ? 1 : 0,
        created_by,
        sender_role,
        sender_department,
        reportType,
        reportDate,
        attachments,
        acknowledgmentString,
        'submitted'
      ]
    );

    res.status(201).json({ message: 'Memo created successfully', memo_id: result.insertId, memo_type });

  } catch (err) {
    console.error('❌ Error creating memo:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// GET /memos - fetch all memos
// GET /api/memos - Fetch all memos
router.get('/memos', async (req, res) => {
  try {
    const [memos] = await db.query('SELECT * FROM memos ORDER BY created_at DESC');
    res.status(200).json(memos);
  } catch (err) {
    console.error('Error fetching memos:', err);
    res.status(500).json({ message: 'Server error while fetching memos' });
  }
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
  let { role } = req.query;

  const approvalRoles = ['manager', 'executive', 'finance', 'gmd', 'chairman'];

  try {
    // 🔸 Get user's department and actual role from DB
    const [userRows] = await db.query(`SELECT department, role FROM users WHERE id = ?`, [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { department, role: actualRole } = userRows[0];

    // 🔸 Normalize role
    let normalizedRole = role?.toLowerCase();

    // 🔸 OVERRIDE role if dept ≠ ICT and actual role is finance
    if (department.toLowerCase() !== 'ict' && actualRole.toLowerCase() === 'finance') {
      normalizedRole = 'finance';
    }

    let query = '';
    let values = [];

    if (normalizedRole && approvalRoles.includes(normalizedRole)) {
      const approvalField = `approved_by_${normalizedRole}`;
      const noDeptRoles = ['finance', 'gmd', 'chairman'];

      if (noDeptRoles.includes(normalizedRole)) {
        query = `
          SELECT m.*, u.role AS sender_role, u.department AS sender_department
          FROM memos m
          JOIN users u ON m.created_by = u.id
          WHERE (
            (m.memo_type = 'normal' AND ${approvalField} IS NULL AND m.requires_approval = 1
              ${normalizedRole === 'chairman' ? 'AND approved_by_gmd = 1' : ''}
            )
            OR (
              m.memo_type = 'report' AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
            )
            OR m.created_by = ?
          )
          ORDER BY m.created_at DESC
        `;
        values = [userId];
      } else {
        // Dept-restricted roles: manager, executive
        query = `
          SELECT m.*, u.role AS sender_role, u.department AS sender_department
          FROM memos m
          JOIN users u ON m.created_by = u.id
          WHERE (
            m.created_by = ?
            OR (
              m.memo_type = 'normal'
              AND ${approvalField} IS NULL
              AND m.requires_approval = 1
              AND u.department = ?
            )
            OR (
              m.memo_type = 'report'
              AND JSON_CONTAINS(m.acknowledgments, '\"${normalizedRole}\"')
              AND u.department = ?
            )
          )
          ORDER BY m.created_at DESC
        `;
        values = [userId, department, department];
      }
    } else {
      // Fallback to user's own memos
      query = `
        SELECT m.*, u.role AS sender_role, u.department AS sender_department
        FROM memos m
        JOIN users u ON m.created_by = u.id
        WHERE m.created_by = ?
        ORDER BY m.created_at DESC
      `;
      values = [userId];
    }

    const [rows] = await db.query(query, values);

    // Parse JSON acknowledgments
    rows.forEach(memo => {
      if (memo.acknowledgments) {
        try {
          memo.acknowledgments = JSON.parse(memo.acknowledgments);
        } catch (e) {
          console.warn(`⚠️ Failed to parse acknowledgments for memo ID ${memo.id}`);
          memo.acknowledgments = [];
        }
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


router.post('/memos/:id/approve', async (req, res) => {
  const memoId = req.params.id;
  const { user_id, role } = req.body;

  try {
    // 1. Fetch memo with creator's department and role
    const [memos] = await db.query(`
      SELECT m.*, u.department, u.role as creator_role 
      FROM memos m
      JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `, [memoId]);

    if (memos.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }

    const memo = memos[0];
const isFinanceCreator = memo.sender_department?.toLowerCase() === 'finance';
const isFinanceApprover = role?.toLowerCase() === 'finance';



    // 2. Define approval rules with Finance exception
  const approvalRules = {
  manager: { 
    field: 'approved_by_manager', 
    dependsOn: null,
    skip: isFinanceCreator
  },
  executive: { 
    field: 'approved_by_executive', 
    dependsOn: 'approved_by_manager',
    skip: isFinanceCreator
  },
  finance: { 
    field: 'approved_by_finance', 
    dependsOn: isFinanceCreator ? null : 'approved_by_manager'
  },
  gmd: { 
    field: 'approved_by_gmd', 
    dependsOn: isFinanceCreator ? 'approved_by_finance' : 'approved_by_manager'
  },
  chairman: { 
    field: 'approved_by_chairman', 
    dependsOn: 'approved_by_gmd' 
  }
};

    if (!approvalRules[role]) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const { field, dependsOn, skip } = approvalRules[role];

    // 3. Handle skipped steps
    if (skip) {
      return res.status(403).json({
        success: false,
        message: `This memo skips ${role} approval due to Finance creator rules.`
      });
    }

    // 4. Check dependency
    if (dependsOn && memo[dependsOn] !== 1) {
      return res.status(403).json({
        success: false,
        message: `Requires ${dependsOn.replace('approved_by_', '')} approval first.`
      });
    }

    // 5. Update approval
    await db.query(`
      UPDATE memos 
      SET ${field} = 1, 
          updated_at = CURRENT_TIMESTAMP,
          status = CASE 
            WHEN ? = 'chairman' THEN 'approved'
            WHEN ? = 'gmd' THEN 'pending_chairman'
            ELSE status
          END
      WHERE id = ?
    `, [role, role, memoId]);

    return res.status(200).json({
      success: true,
      message: `${role} approved the memo.`,
      updatedFields: { [field]: 1 },
      nextApprover: getNextApprover(role, isFinanceCreator)
    });

  } catch (err) {
    console.error('Error approving memo:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper to determine next approver
function getNextApprover(currentRole, isFinanceCreator) {
  const flow = isFinanceCreator
    ? ['finance', 'gmd', 'chairman']  // Finance creator flow
    : ['manager', 'executive', 'finance', 'gmd', 'chairman']; // Normal flow
  
  const currentIndex = flow.indexOf(currentRole);
  return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
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









module.exports = router;