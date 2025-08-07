const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new requisition
router.post('/requisitions', async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      created_by,
      items = [],
      total_amount
    } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Get sender info
    const [[user]] = await db.query(
      'SELECT role, department FROM users WHERE id = ?',
      [created_by]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const sender_role = user.role;
    const sender_department = user.department;

    // Insert requisition
    const [result] = await db.execute(
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
    for (const item of items) {
      await db.execute(
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

    res.status(201).json({ 
      message: 'Requisition created successfully', 
      requisition_id: requisitionId 
    });

  } catch (err) {
    console.error('❌ Error creating requisition:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
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

    // Get items for each requisition
    for (const row of rows) {
      const [items] = await db.query(
        'SELECT name, quantity, unit_price, total_price FROM requisition_items WHERE requisition_id = ?',
        [row.id]
      );
      row.items = items || [];
      
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

// Approve requisition
router.post('/requisitions/:id/approve', async (req, res) => {
  const requisitionId = req.params.id;
  const { user_id, role, department } = req.body;

  try {
    // 1. Fetch requisition with creator details
    const [requisitions] = await db.query(`
      SELECT r.*, u.department as sender_department, u.role as sender_role
      FROM requisitions r
      JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [requisitionId]);

    if (requisitions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Requisition not found',
        details: `No requisition found with ID: ${requisitionId}`
      });
    }

    const requisition = requisitions[0];
    const isICTDepartment = requisition.sender_department?.toLowerCase() === 'ict';
    const isFinanceDepartment = requisition.sender_department?.toLowerCase() === 'finance';

    // 2. Define approval rules
    const approvalRules = {
      manager: {
        field: 'approved_by_manager',
        dependsOn: null,
        allowed: !isFinanceDepartment,
        message: isFinanceDepartment 
          ? 'Finance requisitions skip manager approval' 
          : 'Manager approval required'
      },
      executive: {
        field: 'approved_by_executive',
        dependsOn: 'approved_by_manager',
        allowed: !isFinanceDepartment,
        message: isFinanceDepartment
          ? 'Finance requisitions skip executive approval'
          : 'Executive approval requires manager approval first'
      },
      finance: {
        field: 'approved_by_finance',
        dependsOn: isICTDepartment ? 'approved_by_manager' : 
                  isFinanceDepartment ? null : 'approved_by_executive',
        allowed: true,
        message: 'Finance approval processed'
      },
      gmd: {
        field: 'approved_by_gmd',
        dependsOn: isFinanceDepartment ? 'approved_by_finance' : 'approved_by_executive',
        allowed: true,
        message: 'GMD approval required'
      },
      chairman: {
        field: 'approved_by_chairman',
        dependsOn: 'approved_by_gmd',
        allowed: true,
        message: 'Chairman approval requires GMD approval first'
      }
    };

    // 3. Validate approval attempt
    if (!approvalRules[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval role',
        details: `Role ${role} cannot approve requisitions`
      });
    }

    const { field, dependsOn, allowed, message } = approvalRules[role];

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Approval not permitted',
        details: message
      });
    }

    // 4. Check dependency
    if (dependsOn && requisition[dependsOn] !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Dependency not satisfied',
        details: `Requires ${dependsOn.replace('approved_by_', '')} approval first`
      });
    }

    // 5. Update approval status
    await db.query(`
      UPDATE requisitions 
      SET ${field} = 1,
          status = CASE
            WHEN ? = 'chairman' THEN 'approved'
            WHEN ? = 'gmd' THEN 'pending_chairman'
            WHEN ? = 'finance' AND sender_department = 'finance' THEN 'pending_gmd'
            WHEN ? = 'executive' THEN 'pending_finance'
            WHEN ? = 'manager' THEN 'pending_executive'
            ELSE 'in_review'
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [role, role, role, role, role, requisitionId]);

    // 6. Determine next approver
    const nextApprover = getNextApprover(role, isFinanceDepartment);

    return res.status(200).json({
      success: true,
      message: `${role} approval successful`,
      updatedField: field,
      requisitionStatus: getUpdatedStatus(role, isFinanceDepartment),
      nextApprover,
      approvalFlow: getApprovalFlow(isFinanceDepartment)
    });

  } catch (err) {
    console.error('Approval error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: err.message
    });
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
      chairman: 'approved_by_chairman',
    };

    const field = roleFieldMap[role];

    if (!field) {
      return res.status(403).json({ message: 'User role not authorized to reject requisitions' });
    }

    const updateQuery = `
      UPDATE requisitions 
      SET ${field} = -1, status = 'rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await db.query(updateQuery, [requisitionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    return res.status(200).json({
      success: true,
      message: `${role} rejected the requisition.`,
      field,
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

module.exports = router;