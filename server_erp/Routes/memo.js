const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new memo
router.post('/memos', async (req, res) => {
    try {
        const { title, content, created_by, priority, memo_type, requisition_data } = req.body;

        if (!title || !content || !created_by) {
            return res.status(400).json({ message: 'Title, content, and created_by are required.' });
        }

        // Validate requisition data if memo_type is requisition
        if (memo_type === 'requisition') {
            if (!requisition_data || !requisition_data.requestedBy || !requisition_data.department || 
                !requisition_data.requestedItems || !requisition_data.justification) {
                return res.status(400).json({ 
                    message: 'For requisition memos: requestedBy, department, requestedItems, and justification are required.' 
                });
            }
        }

        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Insert main memo
            const memoSql = `
                INSERT INTO memos (title, content, created_by, priority, memo_type)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [memoResult] = await connection.query(memoSql, [
                title, 
                content, 
                created_by, 
                priority || 'medium',
                memo_type || 'normal'
            ]);

            const memoId = memoResult.insertId;

            // Insert requisition data if applicable
            if (memo_type === 'requisition' && requisition_data) {
                const requisitionSql = `
                    INSERT INTO memo_requisitions (
                        memo_id, requested_by, department, requested_items, 
                        quantity, estimated_cost, justification, approval_required
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await connection.query(requisitionSql, [
                    memoId,
                    requisition_data.requestedBy,
                    requisition_data.department,
                    requisition_data.requestedItems,
                    requisition_data.quantity || null,
                    requisition_data.estimatedCost || null,
                    requisition_data.justification,
                    requisition_data.approvalRequired || false
                ]);
            }

            await connection.commit();

            return res.status(201).json({
                message: 'Memo created successfully',
                memo_id: memoId
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error creating memo:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// GET /memos - fetch all memos with requisition data
router.get('/memos', async (req, res) => {
    try {
        const sql = `
            SELECT 
                m.*,
                mr.requested_by,
                mr.department,
                mr.requested_items,
                mr.quantity,
                mr.estimated_cost,
                mr.justification,
                mr.approval_required
            FROM memos m
            LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
            ORDER BY m.created_at DESC
        `;
        const [results] = await db.query(sql);

        return res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching memos:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

router.get('/memos/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // First query: Get user details
        const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userRows[0];
        let query = '';
        let queryParams = [];

        // Determine query based on user role
        switch (user.role) {
            case 'gmd':
                query = `
                    SELECT 
                        m.*,
                        mr.requested_by,
                        mr.department,
                        mr.requested_items,
                        mr.quantity,
                        mr.estimated_cost,
                        mr.justification,
                        mr.approval_required
                    FROM memos m
                    LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
                    WHERE 
                        (m.approved_by_gmd = 0)
                        OR (m.approved_by_gmd = 1 AND m.approved_by_finance = 1 AND m.approved_by_gmd2 = 0)
                `;
                break;
            case 'finance':
                query = `
                    SELECT 
                        m.*,
                        mr.requested_by,
                        mr.department,
                        mr.requested_items,
                        mr.quantity,
                        mr.estimated_cost,
                        mr.justification,
                        mr.approval_required
                    FROM memos m
                    LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
                    WHERE m.approved_by_finance = 0
                `;
                break;
            case 'chairman':
                query = `
                    SELECT 
                        m.*,
                        mr.requested_by,
                        mr.department,
                        mr.requested_items,
                        mr.quantity,
                        mr.estimated_cost,
                        mr.justification,
                        mr.approval_required
                    FROM memos m
                    LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
                    WHERE m.approved_by_chairman = 0
                `;
                break;
            case 'manager':
                query = `
                    SELECT 
                        m.*,
                        mr.requested_by,
                        mr.department,
                        mr.requested_items,
                        mr.quantity,
                        mr.estimated_cost,
                        mr.justification,
                        mr.approval_required
                    FROM memos m
                    LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
                    WHERE m.status = "in_review"
                `;
                break;
            default:
                query = `
                    SELECT 
                        m.*,
                        mr.requested_by,
                        mr.department,
                        mr.requested_items,
                        mr.quantity,
                        mr.estimated_cost,
                        mr.justification,
                        mr.approval_required
                    FROM memos m
                    LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
                    WHERE m.created_by = ?
                `;
                queryParams = [userId];
        }

        // Second query: Get memos
        const [memos] = await db.query(query, queryParams);

        res.json({ success: true, data: memos });
    } catch (err) {
        console.error('Error fetching memos:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /memos/:id - fetch a specific memo by ID with requisition data
router.get('/memos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                m.*,
                mr.requested_by,
                mr.department,
                mr.requested_items,
                mr.quantity,
                mr.estimated_cost,
                mr.justification,
                mr.approval_required
            FROM memos m
            LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
            WHERE m.id = ?
        `;

        const [results] = await db.query(sql, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Memo not found' });
        }

        return res.status(200).json(results[0]);
    } catch (err) {
        console.error('Error fetching memo by ID:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// Update memo (including requisition data)
router.put('/memos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, priority, memo_type, requisition_data } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        // Validate requisition data if memo_type is requisition
        if (memo_type === 'requisition') {
            if (!requisition_data || !requisition_data.requestedBy || !requisition_data.department || 
                !requisition_data.requestedItems || !requisition_data.justification) {
                return res.status(400).json({ 
                    message: 'For requisition memos: requestedBy, department, requestedItems, and justification are required.' 
                });
            }
        }

        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Update main memo
            const memoSql = `
                UPDATE memos 
                SET title = ?, content = ?, priority = ?, memo_type = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const [memoResult] = await connection.query(memoSql, [
                title, 
                content, 
                priority || 'medium',
                memo_type || 'normal',
                id
            ]);

            if (memoResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Memo not found' });
            }

            // Handle requisition data
            if (memo_type === 'requisition' && requisition_data) {
                // Check if requisition record exists
                const [existingRequisition] = await connection.query(
                    'SELECT id FROM memo_requisitions WHERE memo_id = ?', [id]
                );

                if (existingRequisition.length > 0) {
                    // Update existing requisition
                    const updateRequisitionSql = `
                        UPDATE memo_requisitions 
                        SET requested_by = ?, department = ?, requested_items = ?, 
                            quantity = ?, estimated_cost = ?, justification = ?, 
                            approval_required = ?
                        WHERE memo_id = ?
                    `;

                    await connection.query(updateRequisitionSql, [
                        requisition_data.requestedBy,
                        requisition_data.department,
                        requisition_data.requestedItems,
                        requisition_data.quantity || null,
                        requisition_data.estimatedCost || null,
                        requisition_data.justification,
                        requisition_data.approvalRequired || false,
                        id
                    ]);
                } else {
                    // Insert new requisition
                    const insertRequisitionSql = `
                        INSERT INTO memo_requisitions (
                            memo_id, requested_by, department, requested_items, 
                            quantity, estimated_cost, justification, approval_required
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    await connection.query(insertRequisitionSql, [
                        id,
                        requisition_data.requestedBy,
                        requisition_data.department,
                        requisition_data.requestedItems,
                        requisition_data.quantity || null,
                        requisition_data.estimatedCost || null,
                        requisition_data.justification,
                        requisition_data.approvalRequired || false
                    ]);
                }
            } else if (memo_type === 'normal') {
                // Remove requisition data if memo type changed to normal
                await connection.query('DELETE FROM memo_requisitions WHERE memo_id = ?', [id]);
            }

            await connection.commit();

            return res.status(200).json({
                message: 'Memo updated successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error updating memo:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// Approve memo
router.post('/memos/:id/approve', async (req, res) => {
    try {
        const memoId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required for approval.' });
        }

        const roleApprovalMap = {
            gmd: { field: 'approved_by_gmd', dependsOn: null },
            finance: { field: 'approved_by_finance', dependsOn: 'approved_by_gmd' },
            gmd2: { field: 'approved_by_gmd2', dependsOn: 'approved_by_finance' },
            chairman: { field: 'approved_by_chairman', dependsOn: 'approved_by_gmd2' }
        };

        const userSql = 'SELECT role FROM users WHERE id = ?';
        const [userResults] = await db.query(userSql, [user_id]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = userResults[0].role;

        if (!roleApprovalMap[role]) {
            return res.status(403).json({ message: 'User role is not authorized to approve' });
        }

        if (role === 'gmd') {
            const gmdCheckSql = `SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2 FROM memos WHERE id = ?`;
            const [checkResults] = await db.query(gmdCheckSql, [memoId]);

            if (checkResults.length === 0) {
                return res.status(404).json({ message: 'Memo not found' });
            }

            const memo = checkResults[0];

            if (memo.approved_by_gmd === 0) {
                // First GMD approval
                const updateSql = `UPDATE memos SET approved_by_gmd = 1 WHERE id = ?`;
                await db.query(updateSql, [memoId]);
                return res.status(200).json({ message: 'Approved by GMD', field: 'approved_by_gmd' });
            } else if (memo.approved_by_gmd === 1 && memo.approved_by_finance === 1 && memo.approved_by_gmd2 === 0) {
                // GMD acting as GMD2 after Finance
                const updateSql = `UPDATE memos SET approved_by_gmd2 = 1 WHERE id = ?`;
                await db.query(updateSql, [memoId]);
                return res.status(200).json({ message: 'Approved by GMD2', field: 'approved_by_gmd2' });
            } else {
                return res.status(400).json({ message: 'GMD cannot approve at this stage or already approved' });
            }
        } else {
            const { field, dependsOn } = roleApprovalMap[role];
            const checkSql = `SELECT ${field}${dependsOn ? `, ${dependsOn}` : ''} FROM memos WHERE id = ?`;
            const [checkResults] = await db.query(checkSql, [memoId]);

            if (checkResults.length === 0) {
                return res.status(404).json({ message: 'Memo not found' });
            }

            const memo = checkResults[0];

            if (memo[field] === 1) {
                return res.status(400).json({ message: `Already approved by ${role}` });
            }

            if (dependsOn && memo[dependsOn] !== 1) {
                return res.status(403).json({
                    message: `Cannot approve yet. Waiting for ${dependsOn.replace('approved_by_', '')} approval.`
                });
            }

            const updateSql = `UPDATE memos SET ${field} = 1 WHERE id = ?`;
            await db.query(updateSql, [memoId]);

            // Check if all approvals are completed
            const checkAllApprovalsSql = `
                SELECT approved_by_gmd, approved_by_finance, approved_by_gmd2, approved_by_chairman
                FROM memos
                WHERE id = ?
            `;
            const [allResults] = await db.query(checkAllApprovalsSql, [memoId]);
            
            if (allResults.length > 0) {
                const allApproved = Object.values(allResults[0]).every(val => val === 1);
                if (allApproved) {
                    await db.query(`UPDATE memos SET status = 'approved' WHERE id = ?`, [memoId]);
                }
            }

            return res.status(200).json({ message: `Approved by ${role}`, field });
        }
    } catch (err) {
        console.error('Error in memo approval process:', err);
        return res.status(500).json({ message: 'Error updating approval status' });
    }
});

// Reject memo
router.post('/memos/:id/reject', async (req, res) => {
    try {
        const memoId = req.params.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to reject memo' });
        }

        const getUserRoleSql = 'SELECT role FROM users WHERE id = ?';
        const [userResults] = await db.query(getUserRoleSql, [userId]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = userResults[0].role;

        let updateClause = '';
        let field = '';

        switch (role) {
            case 'gmd':
                updateClause = 'rejected_by_gmd = 1';
                field = 'rejected_by_gmd';
                break;
            case 'finance':
                updateClause = 'rejected_by_finance = 1';
                field = 'rejected_by_finance';
                break;
            case 'gmd2':
                updateClause = 'rejected_by_gmd2 = 1';
                field = 'rejected_by_gmd2';
                break;
            case 'chairman':
                updateClause = 'rejected_by_chairman = 1';
                field = 'rejected_by_chairman';
                break;
            default:
                return res.status(403).json({ message: 'User role not authorized to reject memos' });
        }

        const rejectMemoSql = `UPDATE memos SET ${updateClause} WHERE id = ?`;
        const [updateResults] = await db.query(rejectMemoSql, [memoId]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).json({ message: 'Memo not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Memo rejected successfully',
            field,
        });
    } catch (err) {
        console.error('Error rejecting memo:', err);
        return res.status(500).json({ message: 'Error rejecting memo' });
    }
});

// Delete memo (including requisition data)
router.delete('/memos/:id', async (req, res) => {
    try {
        const memoId = req.params.id;

        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Delete requisition data first (foreign key constraint)
            await connection.query('DELETE FROM memo_requisitions WHERE memo_id = ?', [memoId]);

            // Delete memo
            const [result] = await connection.query('DELETE FROM memos WHERE id = ?', [memoId]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Memo not found' });
            }

            await connection.commit();
            res.status(200).json({ message: 'Memo deleted successfully' });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error deleting memo:', err);
        return res.status(500).json({ message: 'Error deleting memo' });
    }
});

// Get memos for approval by user role (with requisition data)
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
                whereClause = 'm.approved_by_gmd = 0';
                break;
            case 'finance':
                whereClause = 'm.approved_by_gmd = 1 AND m.approved_by_finance = 0';
                break;
            case 'gmd2':
                whereClause = 'm.approved_by_finance = 1 AND m.approved_by_gmd2 = 0';
                break;
            case 'chairman':
                whereClause = 'm.approved_by_gmd2 = 1 AND m.approved_by_chairman = 0';
                break;
            default:
                return res.status(403).json({ message: 'User role not authorized to view memos for approval' });
        }

        const getMemosSql = `
            SELECT 
                m.*,
                mr.requested_by,
                mr.department,
                mr.requested_items,
                mr.quantity,
                mr.estimated_cost,
                mr.justification,
                mr.approval_required
            FROM memos m
            LEFT JOIN memo_requisitions mr ON m.id = mr.memo_id
            WHERE ${whereClause}
            ORDER BY m.created_at DESC
        `;
        const [memoResults] = await db.query(getMemosSql);

        res.status(200).json(memoResults);
    } catch (err) {
        console.error('Error fetching memos for approval:', err);
        return res.status(500).json({ message: 'Error fetching memos for approval' });
    }
});

module.exports = router;