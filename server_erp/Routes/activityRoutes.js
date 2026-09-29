const express = require('express');
const router = express.Router();
const db = require('../db');

// Get recent activities across all modules
router.get('/activities/recent', async (req, res) => {
  try {
    // Get recent memos
    const [memos] = await db.query(`
      SELECT id, title, 'Memo' as type, status, created_at
      FROM memos
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    // Get recent requisitions
    const [requisitions] = await db.query(`
      SELECT id, title, 'Requisition' as type, status, created_at
      FROM requisitions
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    // Get recent tasks
    const [tasks] = await db.query(`
      SELECT id, title, 'Task' as type, status, created_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    // Get recent leave requests
    const [leaves] = await db.query(`
      SELECT id, CONCAT('Leave Request - ', type) as title, 'Leave' as type, status, created_at
      FROM leave_requests
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    // Get recent direct memos
    const [directMemos] = await db.query(`
      SELECT id, title, 'DirectMemo' as type,
             COALESCE(NULLIF(approval_status, ''), status) as status,
             created_at
      FROM direct_memos
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    // Combine all activities
    const allActivities = [...memos, ...requisitions, ...tasks, ...leaves, ...directMemos];
    
    // Sort by creation date (newest first)
    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Format for frontend (limit to 6 most recent)
    const recentActivities = allActivities.slice(0, 6).map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      status: normalizeStatus(activity.status),
      description: describeActivity(activity.type),
      time: formatTimeAgo(activity.created_at)
    }));
    
    res.json(recentActivities);
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Helper function to format time as "X hours/days ago"
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
}

// Short human-readable description for each activity type
function describeActivity(type) {
  switch (type) {
    case 'Memo': return 'Memo submission';
    case 'Requisition': return 'Requisition request';
    case 'Task': return 'Task activity';
    case 'Leave': return 'Leave application';
    case 'DirectMemo': return 'Direct memo';
    default: return 'Recent activity';
  }
}

// Normalise varied module statuses into a small, stable set for the UI
function normalizeStatus(status) {
  const s = String(status || '').toLowerCase();
  if (['approved', 'completed', 'complete', 'read', 'fully_approved', 'delivered', 'paid', 'done'].includes(s)) return 'completed';
  if (['rejected', 'declined', 'cancelled', 'canceled'].includes(s)) return 'rejected';
  return 'pending';
}

module.exports = router;