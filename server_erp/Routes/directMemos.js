const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/direct-memos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const safeParseJSON = (data, defaultValue = []) => {
  if (!data) return defaultValue;
  
  // If it's already an array, return it
  if (Array.isArray(data)) return data;
  
  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      const trimmed = data.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
        return defaultValue;
      }
      return JSON.parse(trimmed);
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue;
    }
  }
  
  // For any other data type, return default
  return defaultValue;
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
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
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware to check if chairman is in recipients (only for non-executive/gmd/finance users)
const checkChairmanRecipient = async (req, res, next) => {
  try {
    const { created_by, recipients } = req.body;
    
    if (!created_by) {
      return res.status(400).json({ message: 'User ID (created_by) is required' });
    }
    
    // Get user role from database
    const [users] = await db.execute(
      "SELECT role FROM users WHERE id = ?",
      [created_by]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userRole = users[0].role?.toLowerCase();
    
    // If user is executive, gmd, or finance, they can send to anyone including chairman
    if (['executive', 'gmd', 'finance'].includes(userRole)) {
      return next();
    }
    
    // For other roles, check if chairman is in recipients
    const recipientsArray = JSON.parse(recipients);
    
    // Get chairman user IDs
    const [chairmen] = await db.execute(
      "SELECT id FROM users WHERE LOWER(role) = 'chairman'"
    );
    
    const chairmanIds = chairmen.map(c => c.id);
    
    // Check if any chairman is in recipients
    const hasChairmanInRecipients = recipientsArray.some(recipientId => 
      chairmanIds.includes(recipientId)
    );
    
    if (hasChairmanInRecipients) {
      return res.status(403).json({ 
        message: 'Only executive, GMD, and finance roles can send Task Reports directly to the chairman. You can add the chairman to CC instead.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking chairman recipient:', error);
    res.status(500).json({ message: 'Failed to verify recipients', error: error.message });
  }
};

// Create a new task report
router.post('/', upload.array('files'), checkChairmanRecipient, async (req, res) => {
  try {
    const { title, content, created_by, priority, recipients, cc, task_id } = req.body;
    
    // Parse recipients and CC
    const recipientsArray = JSON.parse(recipients);
    const ccArray = cc ? JSON.parse(cc) : [];
    
    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }
    
    // Insert memo into database
    const insertQuery = task_id 
      ? `INSERT INTO direct_memos (title, content, created_by, recipients, cc, priority, attachments, task_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO direct_memos (title, content, created_by, recipients, cc, priority, attachments) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const params = task_id
      ? [title, content, created_by, JSON.stringify(recipientsArray), JSON.stringify(ccArray), priority, JSON.stringify(attachments), task_id]
      : [title, content, created_by, JSON.stringify(recipientsArray), JSON.stringify(ccArray), priority, JSON.stringify(attachments)];
    
    const [result] = await db.execute(insertQuery, params);
    
    res.status(201).json({
      message: 'Task report created successfully',
      memoId: result.insertId
    });
  } catch (error) {
    console.error('Error creating task report:', error);
    res.status(500).json({ message: 'Failed to create task report', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [memos] = await db.execute(`
      SELECT dm.*, u.name as sender_name, u.department as sender_department,
             t.title as task_title
      FROM direct_memos dm
      LEFT JOIN users u ON dm.created_by = u.id
      LEFT JOIN tasks t ON dm.task_id = t.id
      WHERE JSON_CONTAINS(dm.recipients, ?) OR JSON_CONTAINS(dm.cc, ?) OR dm.created_by = ?
      ORDER BY dm.created_at DESC
    `, [JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId)), parseInt(userId)]);
    
    // Parse JSON fields safely for each memo
    const parsedMemos = memos.map(memo => ({
      ...memo,
      recipients: safeParseJSON(memo.recipients),
      cc: safeParseJSON(memo.cc),
      attachments: safeParseJSON(memo.attachments)
    }));
    
    res.json(parsedMemos);
  } catch (error) {
    console.error('Error fetching Task Reports:', error);
    res.status(500).json({ message: 'Failed to fetch Task Reports', error: error.message });
  }
});

// Get a specific Task Report
router.get('/:memoId', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const userId = req.query.userId;
    
    const [memos] = await db.execute(`
      SELECT dm.*, u.name as sender_name, u.department as sender_department,
             t.title as task_title, t.description as task_description
      FROM direct_memos dm
      LEFT JOIN users u ON dm.created_by = u.id
      LEFT JOIN tasks t ON dm.task_id = t.id
      WHERE dm.id = ? AND (JSON_CONTAINS(dm.recipients, ?) OR JSON_CONTAINS(dm.cc, ?) OR dm.created_by = ?)
    `, [memoId, JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId)), parseInt(userId)]);
    
    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }
    
    // Parse JSON fields safely
    const memo = {
      ...memos[0],
      recipients: safeParseJSON(memos[0].recipients),
      cc: safeParseJSON(memos[0].cc),
      attachments: safeParseJSON(memos[0].attachments)
    };
    
    // Get approval status for this memo
    const [approvals] = await db.execute(`
      SELECT dma.*, u.name as user_name, u.department as user_department
      FROM direct_memo_approvals dma
      LEFT JOIN users u ON dma.user_id = u.id
      WHERE dma.memo_id = ?
    `, [memoId]);
    
    memo.approvals = approvals;
    
    res.json(memo);
  } catch (error) {
    console.error('Error fetching Task Report:', error);
    res.status(500).json({ message: 'Failed to fetch Task Report', error: error.message });
  }
});

// Mark a Task Report as read
router.post('/:memoId/read', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const userId = req.body.user_id;
    
    // Check if user has access to this memo
    const [memos] = await db.execute(`
      SELECT * FROM direct_memos 
      WHERE id = ? AND (JSON_CONTAINS(recipients, ?) OR JSON_CONTAINS(cc, ?))
    `, [memoId, JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId))]);
    
    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }
    
    // Update read status
    await db.execute(`
      INSERT INTO direct_memo_read_status (memo_id, user_id) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
    `, [memoId, userId]);
    
    // Update memo status if all recipients have read it
    const [readStatus] = await db.execute(`
      SELECT COUNT(*) as read_count FROM direct_memo_read_status 
      WHERE memo_id = ?
    `, [memoId]);
    
    const [memo] = await db.execute(`SELECT recipients, cc FROM direct_memos WHERE id = ?`, [memoId]);
    
    // Safely parse JSON data with better error handling
    let recipients = [];
    let cc = [];
    
    try {
      const recipientsData = memo[0].recipients;
      if (Array.isArray(recipientsData)) {
        recipients = recipientsData;
      } else if (typeof recipientsData === 'string' && recipientsData.trim() !== '') {
        recipients = JSON.parse(recipientsData);
      }
    } catch (parseError) {
      console.error('Error parsing recipients JSON:', parseError);
      recipients = [];
    }
    
    try {
      const ccData = memo[0].cc;
      if (Array.isArray(ccData)) {
        cc = ccData;
      } else if (typeof ccData === 'string' && ccData.trim() !== '') {
        cc = JSON.parse(ccData);
      }
    } catch (parseError) {
      console.error('Error parsing cc JSON:', parseError);
      cc = [];
    }
    
    const totalRecipients = recipients.length + cc.length;
    
    if (readStatus[0].read_count >= totalRecipients) {
      await db.execute(`UPDATE direct_memos SET status = 'read' WHERE id = ?`, [memoId]);
    } else {
      await db.execute(`UPDATE direct_memos SET status = 'delivered' WHERE id = ?`, [memoId]);
    }
    
    res.json({ message: 'Memo marked as read' });
  } catch (error) {
    console.error('Error marking memo as read:', error);
    res.status(500).json({ message: 'Failed to mark memo as read', error: error.message });
  }
});

// Add comment to Task Report
router.post('/:memoId/comments', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const { comment, user_id } = req.body;
    
    // Check if user has access to this memo
    const [memos] = await db.execute(`
      SELECT * FROM direct_memos 
      WHERE id = ? AND (JSON_CONTAINS(recipients, ?) OR JSON_CONTAINS(cc, ?) OR created_by = ?)
    `, [memoId, JSON.stringify(parseInt(user_id)), JSON.stringify(parseInt(user_id)), parseInt(user_id)]);
    
    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }
    
    // Insert comment
    const [result] = await db.execute(`
      INSERT INTO direct_memo_comments (memo_id, user_id, comment) 
      VALUES (?, ?, ?)
    `, [memoId, user_id, comment]);
    
    res.status(201).json({
      message: 'Comment added successfully',
      commentId: result.insertId
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Get comments for a Task Report 
router.get('/:memoId/comments', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const userId = parseInt(req.query.userId);

    // Check if user has access to this memo
    const [memos] = await db.execute(`
      SELECT * FROM direct_memos 
      WHERE id = ? AND (JSON_CONTAINS(recipients, ?) OR JSON_CONTAINS(cc, ?) OR created_by = ?)
    `, [memoId, JSON.stringify(userId), JSON.stringify(userId), userId]);

    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }

    // Get comments with user names
    const [comments] = await db.execute(`
      SELECT dmc.*, u.name as user_name 
      FROM direct_memo_comments dmc
      LEFT JOIN users u ON dmc.user_id = u.id
      WHERE dmc.memo_id = ?
      ORDER BY dmc.created_at ASC
    `, [memoId]);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
});

// Download attachment
router.get('/download/:memoId/:filename', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const filename = req.params.filename;
    const userId = req.query.userId;
    
    // Check if user has access to this memo
    const [memos] = await db.execute(`
      SELECT * FROM direct_memos 
      WHERE id = ? AND (JSON_CONTAINS(recipients, ?) OR JSON_CONTAINS(cc, ?) OR created_by = ?)
    `, [memoId, JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId)), parseInt(userId)]);
    
    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }
    
    // Get file info from attachments using safe parsing
    const attachments = safeParseJSON(memos[0].attachments);
    const file = attachments.find(f => f.filename === filename);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.download(file.path, file.originalname);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
});

router.post('/:memoId/approve', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const { user_id, status, comments } = req.body;
    
    // Check if user is a recipient (only recipients can approve/reject)
    const [memos] = await db.execute(
      `SELECT * FROM direct_memos 
       WHERE id = ? AND JSON_CONTAINS(recipients, ?)`,
      [memoId, JSON.stringify(parseInt(user_id))]
    );
    
    if (memos.length === 0) {
      return res.status(403).json({ message: 'Only recipients can approve/reject memos' });
    }
    
    // Update approval status
    await db.execute(
      `INSERT INTO direct_memo_approvals (memo_id, user_id, status, comments) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = ?, comments = ?, updated_at = CURRENT_TIMESTAMP`,
      [memoId, user_id, status, comments, status, comments]
    );
    
    // Check if all recipients have responded
    const [approvals] = await db.execute(
      `SELECT status FROM direct_memo_approvals WHERE memo_id = ?`,
      [memoId]
    );
    
    // Get recipients count
    let recipients = [];
    try {
      const recipientsData = memos[0].recipients;
      if (Array.isArray(recipientsData)) {
        recipients = recipientsData;
      } else if (typeof recipientsData === 'string' && recipientsData.trim() !== '') {
        recipients = JSON.parse(recipientsData);
      }
    } catch (parseError) {
      console.error('Error parsing recipients JSON:', parseError);
      recipients = [];
    }
    
    const allApproved = approvals.every(a => a.status === 'approved');
    const anyRejected = approvals.some(a => a.status === 'rejected');
    const allResponded = approvals.length === recipients.length;
    
    let overallStatus = 'pending';
    if (anyRejected) {
      overallStatus = 'rejected';
    } else if (allApproved && allResponded) {
      overallStatus = 'approved';
    }
    
    // Update memo's overall approval status
    await db.execute(
      `UPDATE direct_memos SET approval_status = ? WHERE id = ?`,
      [overallStatus, memoId]
    );
    
    res.json({ 
      message: `Memo ${status} successfully`, 
      overallStatus,
      userStatus: status
    });
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ message: 'Failed to update approval status', error: error.message });
  }
});

// Get approval status for a memo
router.get('/:memoId/approvals', async (req, res) => {
  try {
    const memoId = req.params.memoId;
    const userId = req.query.userId;
    
    // Check if user has access to this memo
    const [memos] = await db.execute(`
      SELECT * FROM direct_memos 
      WHERE id = ? AND (JSON_CONTAINS(recipients, ?) OR JSON_CONTAINS(cc, ?) OR created_by = ?)
    `, [memoId, JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId)), parseInt(userId)]);
    
    if (memos.length === 0) {
      return res.status(404).json({ message: 'Memo not found or access denied' });
    }
    
    // Get approval status
    const [approvals] = await db.execute(`
      SELECT dma.*, u.name as user_name, u.department as user_department
      FROM direct_memo_approvals dma
      LEFT JOIN users u ON dma.user_id = u.id
      WHERE dma.memo_id = ?
    `, [memoId]);
    
    res.json(approvals);
  } catch (error) {
    console.error('Error fetching approval status:', error);
    res.status(500).json({ message: 'Failed to fetch approval status', error: error.message });
  }
});

// Get Task Report count for a user
router.get('/count/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [unreadCount] = await db.execute(`
      SELECT COUNT(DISTINCT dm.id) as count
      FROM direct_memos dm
      LEFT JOIN direct_memo_read_status dmrs ON dm.id = dmrs.memo_id AND dmrs.user_id = ?
      WHERE (JSON_CONTAINS(dm.recipients, ?) OR JSON_CONTAINS(dm.cc, ?))
      AND dm.created_by != ?
      AND (
        dmrs.memo_id IS NULL 
        OR EXISTS (
          SELECT 1 FROM direct_memo_comments dmc 
          WHERE dmc.memo_id = dm.id 
          AND dmc.created_at > COALESCE(dmrs.read_at, '1970-01-01')
          AND dmc.user_id != ?
        )
      )
    `, [parseInt(userId), JSON.stringify(parseInt(userId)), JSON.stringify(parseInt(userId)), parseInt(userId), parseInt(userId)]);
    
    res.json({
      success: true,
      count: unreadCount[0].count
    });
  } catch (error) {
    console.error('Error fetching unread Task Report count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unread Task Report count', 
      error: error.message 
    });
  }
});

module.exports = router;