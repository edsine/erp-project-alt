const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple test route
router.get('/rep', (req, res) => {
    res.json({ message: 'Reports API is working!' });
});


// POST /report - create a report without file uploads
router.post('/report', async (req, res) => {
    try {
        const {
            title,
            content,
            priority,
            memo_type,
            sender_id,
            sender_role,
            sender_department,
            recipient_id,  // Make sure this is included
            recipient_role,
            recipient_department,
            comments
        } = req.body;

        // Validate required fields
        if (!title || !content || !memo_type || !sender_id) {
            return res.status(400).json({ error: 'Title, content, memo_type, and sender_id are required' });
        }

        // Insert report into database
        const query = `
            INSERT INTO reports (
                title, content, priority, memo_type, 
                sender_id, sender_role, sender_department,
                recipient_id, recipient_role, recipient_department,
                status, comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            title,
            content,
            priority || 'medium',
            memo_type,
            sender_id,
            sender_role || null,
            sender_department || null,
            recipient_id || null,  // This will be null if not provided
            recipient_role || null,
            recipient_department || null,
            'submitted',
            comments || null
        ];

        const [result] = await db.execute(query, values);

        res.status(201).json({
            message: 'Report submitted successfully',
            reportId: result.insertId
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /report/:id - get a specific report by ID
router.get('/report/:id', async (req, res) => {
    try {
        const reportId = req.params.id;

        const query = `
            SELECT * FROM reports WHERE id = ?
        `;

        const [results] = await db.execute(query, [reportId]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json({
            message: 'Report retrieved successfully',
            report: results[0]
        });

    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /reports - get all reports
router.get('/reports', async (req, res) => {
    try {
        const query = `
            SELECT * FROM reports ORDER BY created_at DESC
        `;

        const [results] = await db.execute(query);

        res.status(200).json({
            message: 'Reports retrieved successfully',
            reports: results,
            count: results.length
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/reports/user/:user_id', async (req, res) => {
    try {
        const userId = req.params.user_id;

        const query = `
            SELECT * FROM reports 
            WHERE sender_id = ? OR recipient_id = ? 
            ORDER BY created_at DESC
        `;

        const [results] = await db.execute(query, [userId, userId]);

        res.status(200).json({
            message: 'User reports retrieved successfully',
            reports: results,
            count: results.length
        });

    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;