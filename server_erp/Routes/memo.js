const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new memo
router.post('/memos', async (req, res) => {
    try {
        const { title, content, created_by } = req.body;

        if (!title || !content || !created_by) {
            return res.status(400).json({ message: 'Title, content, and created_by are required.' });
        }

        const sql = `
            INSERT INTO memos (title, content, created_by)
            VALUES (?, ?, ?)
        `;

        const [result] = await db.query(sql, [title, content, created_by]);

        return res.status(201).json({
            message: 'Memo created successfully',
            memo_id: result.insertId
        });
    } catch (err) {
        console.error('Error creating memo:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// GET /memos - fetch all memos
router.get('/memos', async (req, res) => {
    try {
        const sql = 'SELECT * FROM memos ORDER BY created_at DESC';
        const [results] = await db.query(sql);

        return res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching memos:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// GET /memos/user/:userId - fetch memos for specific user based on role
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
                    SELECT * FROM memos
                    WHERE 
                        (approved_by_gmd = 0)
                        OR (approved_by_gmd = 1 AND approved_by_finance = 1 AND approved_by_gmd2 = 0)
                `;
                break;
            case 'finance':
                query = 'SELECT * FROM memos WHERE approved_by_finance = 0';
                break;
            case 'chairman':
                query = 'SELECT * FROM memos WHERE approved_by_chairman = 0';
                break;
            case 'manager':
                query = 'SELECT * FROM memos WHERE status = "in_review"';
                break;
            default:
                query = 'SELECT * FROM memos WHERE created_by = ?';
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

// GET /memos/:id - fetch a specific memo by ID
router.get('/memos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'SELECT * FROM memos WHERE id = ?';

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

// POST /memos/:id/approve - approve memo based on user role
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
            return res.status(200).json({ message: `Approved by ${role}`, field });
        }
    } catch (err) {
        console.error('Error updating approval status:', err);
        return res.status(500).json({ message: 'Error updating approval status' });
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