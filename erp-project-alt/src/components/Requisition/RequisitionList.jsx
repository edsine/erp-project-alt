import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';


const CommentSection = ({ requisitionId, user }) => {
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchComments();
  }, [requisitionId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/requisitions/${requisitionId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/requisitions/${requisitionId}/comments`,
        {
          comment: newComment,
          user_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 201) {
        setNewComment('');
        setShowCommentInput(false);
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-500">Comments ({comments.length})</h3>
        <button
          type="button"
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
        >
          {showCommentInput ? 'Cancel' : 'Add Comment'}
        </button>
      </div>
      
      {/* Comment input - shown only when button is clicked */}
      {showCommentInput && (
        <div className="mb-4 bg-gray-50 p-4 rounded-md">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your comment here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            rows="3"
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => setShowCommentInput(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm text-gray-900">{comment.user_name}</div>
                <div className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              <p className="text-sm mt-2 text-gray-700">{comment.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No comments yet. Be the first to add one!</p>
        )}
      </div>
    </div>
  );
};

// Add this function to the existing helper functions
const getMimeTypeFromFilename = (filename) => {
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
};

const FINANCE_TABS = {
  TO_BE_ACTED: 'to_be_acted',
  ACTED_UPON: 'acted_upon'
};

// File icon helper function 
const getFileIcon = (file) => {
  const fileType = file.mimetype?.split('/')[0] || '';
  const originalName = file.originalname || file.filename || '';
  const extension = originalName.split('.').pop()?.toLowerCase() || '';

  const iconClass = "h-8 w-8 text-gray-400";

  // PDF
  if (file.mimetype === 'application/pdf' || extension === 'pdf') {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Word
  if (file.mimetype?.includes('word') || ['doc', 'docx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Excel
  if (file.mimetype?.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Image
  if (fileType === 'image') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
};

const RequisitionList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { id } = useParams();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const { requisitionId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // Changed default tab to 'pending'
  const [financeActionedRequisitions, setFinanceActionedRequisitions] = useState([]);
  // Add state for decision comments
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [showApprovalComment, setShowApprovalComment] = useState(false);
  const [showRejectionComment, setShowRejectionComment] = useState(false);



  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/users`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const usersMap = response.data.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});

        setUsers(usersMap);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    fetchUsers();
  }, [BASE_URL, user.token]);

  useEffect(() => {
  if (id && requisitions.length > 0) {
    const req = requisitions.find(r => r.id.toString() === id);
    if (req) setSelectedRequisition(req);
  }
}, [id, requisitions]);
useEffect(() => {
  if (requisitionId && requisitions.length > 0) {
    const found = requisitions.find(r => r.id == requisitionId);
    setSelectedRequisition(found);
  }
}, [requisitionId, requisitions]);


  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/requisitions/user/${user.id}?role=${user.role}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        const requisitionsArray = response.data;

        const transformedRequisitions = requisitionsArray.map(req => ({
          ...req,
          requester: users[req.created_by]?.name || `User ${req.created_by}`,
          requesterDetails: users[req.created_by],
          date: new Date(req.created_at).toLocaleDateString(),
          status: req.status || 'submitted',
          priority: req.priority || 'medium'
        }));

        setRequisitions(transformedRequisitions);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch requisitions');
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, [user, users]);

  // Filter requisitions based on search term
  const searchFilteredRequisitions = requisitions.filter(req => {
    return (
      (req.title && req.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof req.requester === 'string' && req.requester.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.items && req.items.some(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  // Helper function to check if requisition is approved
// Updated approval check
const isRequisitionApproved = (req, role, userId) => {
  role = role?.toLowerCase();

  // For approvers - show requisitions they've personally approved
  if (role === 'finance') return req.approved_by_finance === 1;
  if (role === 'gmd') return req.approved_by_gmd === 1;
  if (role === 'chairman') return req.approved_by_chairman === 1;
  if (role === 'manager') return req.approved_by_manager === 1;
  if (role === 'executive') return req.approved_by_executive === 1;

  // For senders - show only fully approved requisitions
  if (req.created_by === userId) {
    return req.approved_by_chairman === 1;
  }

  return false;
};

// Updated pending check
const isRequisitionPendingForUser = (req, role, userId) => {
  role = role?.toLowerCase();
  const senderDept = req.sender_department?.toLowerCase();

  // If rejected or completed → not pending
  if (isRequisitionRejected(req) || isRequisitionCompleted(req)) {
    return false;
  }

  // If user is the sender → show if not fully approved
  if (req.created_by === userId) {
    return req.approved_by_chairman !== 1;
  }

  // Special case for ICT department - normal approval chain
  if (senderDept === 'ict') {
    if (role === 'manager') return !req.approved_by_manager && !req.rejected_by_manager;
    if (role === 'executive') return req.approved_by_manager && !req.approved_by_executive && !req.rejected_by_executive;
    if (role === 'finance') return req.approved_by_executive && !req.approved_by_finance && !req.rejected_by_finance;
    if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
    if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
  }
  // Special case for Finance department - skip to Finance
  else if (senderDept === 'finance') {
    if (role === 'finance') return !req.approved_by_finance && !req.rejected_by_finance;
    if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
    if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
  }
  // All other departments - skip Manager/Executive, go straight to Finance
  else {
    if (role === 'finance') return !req.approved_by_finance && !req.rejected_by_finance;
    if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
    if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
  }

  return false;
};

  // Helper function to check if requisition is rejected
  const isRequisitionRejected = (req) => {
    return req.status.toLowerCase() === 'rejected' ||
           req.rejected_by_manager === 1 ||
           req.rejected_by_executive === 1 ||
           req.rejected_by_finance === 1 ||
           req.rejected_by_gmd === 1 ||
           req.rejected_by_chairman === 1;
  };

  // Helper function to check if requisition is completed
  const isRequisitionCompleted = (req) => {
    return req.status.toLowerCase() === 'completed';
  };

const getFinanceFilteredRequisitions = (tab) => {
  if (user.role?.toLowerCase() !== 'finance') return [];

  const chairmanApprovedRequisitions = searchFilteredRequisitions.filter(
    req => req.approved_by_chairman === 1
  );

  if (tab === FINANCE_TABS.TO_BE_ACTED) {
    return chairmanApprovedRequisitions.filter(
      req => req.paid_by_finance !== 1
    );
  } else if (tab === FINANCE_TABS.ACTED_UPON) {
    return chairmanApprovedRequisitions.filter(
      req => req.paid_by_finance === 1
    );
  }

  return [];
};

  // Filter requisitions by status based on active tab
const getFilteredRequisitionsByStatus = (status) => {
  // Handle finance-specific tabs
  if (user.role?.toLowerCase() === 'finance' &&
    (status === FINANCE_TABS.TO_BE_ACTED || status === FINANCE_TABS.ACTED_UPON)) {
    return getFinanceFilteredRequisitions(status);
  }

  const role = user.role?.toLowerCase();
  const userId = user.id;

  switch (status) {
    case 'all':
      return searchFilteredRequisitions;

    case 'pending':
      return searchFilteredRequisitions.filter(req => 
        isRequisitionPendingForUser(req, role, userId)
      );

    case 'approved':
      return searchFilteredRequisitions.filter(req => 
        isRequisitionApproved(req, role, userId) && 
        !isRequisitionCompleted(req)
      );

    case 'rejected':
      return searchFilteredRequisitions.filter(req => 
        isRequisitionRejected(req)
      );

    case 'completed':
      return searchFilteredRequisitions.filter(req => 
        isRequisitionCompleted(req)
      );

    default:
      return searchFilteredRequisitions;
  }
};


  const filteredRequisitions = getFilteredRequisitionsByStatus(activeTab);

  // Get counts for each status
const getStatusCounts = () => {
  const role = user.role?.toLowerCase();
  const userId = user.id;

  const counts = {
    all: searchFilteredRequisitions.length,
    pending: searchFilteredRequisitions.filter(req =>
      isRequisitionPendingForUser(req, role, userId)
    ).length,
    approved: searchFilteredRequisitions.filter(req =>
      isRequisitionApproved(req, role, userId) && 
      !isRequisitionCompleted(req)
    ).length,
    rejected: searchFilteredRequisitions.filter(req =>
      isRequisitionRejected(req)
    ).length,
    completed: searchFilteredRequisitions.filter(req =>
      isRequisitionCompleted(req)
    ).length,
  };

  //finance-specific counts if user is finance
  if (user.role?.toLowerCase() === 'finance') {
    const chairmanApproved = searchFilteredRequisitions.filter(
      req => req.approved_by_chairman === 1
    );

    counts[FINANCE_TABS.TO_BE_ACTED] = chairmanApproved.filter(
      req => req.paid_by_finance !== 1
    ).length;

    counts[FINANCE_TABS.ACTED_UPON] = chairmanApproved.filter(
      req => req.paid_by_finance === 1
    ).length;
  }

  return counts;
};


  const statusCounts = getStatusCounts();

  const handleRequisitionClick = (req) => {
    if (selectedRequisition && selectedRequisition.id === req.id) {
      setSelectedRequisition(null);
    } else {
      setSelectedRequisition(req);
    }
  };


const handlePayRequisition = async (requisition) => {
  try {
    // Make API call to mark requisition as paid in database
    const response = await axios.post(
      `${BASE_URL}/requisitions/${requisition.id}/mark-paid`,
      { user_id: user.id },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (response.status === 200) {
      alert('Requisition marked as paid successfully!');
      
      // Update the requisition status locally
      const updatedRequisition = {
        ...requisition,
        paid_by_finance: 1
      };
      
      setRequisitions(prev => prev.map(r => r.id === requisition.id ? updatedRequisition : r));
      setSelectedRequisition(updatedRequisition);
    }
  } catch (error) {
    console.error('Payment failed:', error.response?.data || error.message);
    alert(`❌ Error: ${error.response?.data?.message || 'Payment failed'}`);
  }
};

const handleApprove = async (req) => {
  // Chairman doesn't need recommendation/remark
  if (user.role.toLowerCase() !== 'chairman' && !approvalComment.trim()) {
    alert('Please add recommendations for approval');
    return;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/requisitions/${req.id}/approve`,
      {
        user_id: user.id,
        role: user.role,
      },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (response.status === 200) {
      // Add approval comment only if not chairman or if comment exists
      if (user.role.toLowerCase() !== 'chairman' || approvalComment.trim()) {
        await axios.post(
          `${BASE_URL}/requisitions/${req.id}/comments`,
          {
            comment: user.role.toLowerCase() === 'chairman'
              ? approvalComment.trim()
                ? `Chairman Approval: ${approvalComment}`
                : 'Chairman Approval'
              : `Recommendation: ${approvalComment}`,
            user_id: user.id,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      }

      alert(`✅ Success: ${response.data.message}`);
      const updatedRequisition = {
        ...req,
        ...response.data.updatedFields,
        [`approved_by_${user.role}`]: 1,
        [`rejected_by_${user.role}`]: 0
      };
      
      setRequisitions(prev => prev.map(r => r.id === req.id ? updatedRequisition : r));
      setSelectedRequisition(updatedRequisition);
      setApprovalComment('');
      setShowApprovalComment(false);
      
      // Close the requisition after approval
      setSelectedRequisition(null);

      if (response.data.nextApprover) {
        alert(`Next approver: ${response.data.nextApprover}`);
      }
    }
  } catch (error) {
    console.error('Approval failed:', error.response?.data || error.message);
    alert(`❌ Error: ${error.response?.data?.message || 'Approval failed'}`);
  }
};

const handleReject = async (req) => {
  // Chairman doesn't need remark for rejection
  if (user.role.toLowerCase() !== 'chairman' && !rejectionComment.trim()) {
    alert('Please add remarks for rejection');
    return;
  }

  if (!req) return;

  try {
    const response = await axios.post(
      `${BASE_URL}/requisitions/${req.id}/reject`,
      { userId: user.id },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (response.data?.success) {
      // Add rejection comment only if not chairman or if comment exists
      if (user.role.toLowerCase() !== 'chairman' || rejectionComment.trim()) {
        await axios.post(
          `${BASE_URL}/requisitions/${req.id}/comments`,
          {
            comment: user.role.toLowerCase() === 'chairman'
              ? rejectionComment.trim()
                ? `Chairman Rejection: ${rejectionComment}`
                : 'Chairman Rejection'
              : `Rejection Remark: ${rejectionComment}`,
            user_id: user.id,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      }

      const { field } = response.data;

      const updatedRequisitions = requisitions.map(r =>
        r.id === req.id
          ? {
            ...r,
            status: 'rejected',
            [field]: -1,
          }
          : r
      );

      setRequisitions(updatedRequisitions);

      if (selectedRequisition?.id === req.id) {
        setSelectedRequisition(prev => ({
          ...prev,
          status: 'rejected',
          [field]: -1,
        }));
        
        // Close the requisition after rejection
        setSelectedRequisition(null);
      }

      setRejectionComment('');
      setShowRejectionComment(false);
      setError(null);
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to reject requisition');
  }
};

  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          text: 'Approved',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'rejected':
        return {
          className: 'bg-red-100 text-red-800 border-red-200',
          text: 'Rejected',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'completed':
        return {
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Completed',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'submitted':
        return {
          className: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Submitted',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )
        };
      default:
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Pending',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return {
          className: 'bg-red-100 text-red-800 border-red-200',
          text: 'High',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )
        };
      case 'medium':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Medium',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          )
        };
      default:
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          text: 'Low',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )
        };
    }
  };

  if (loading) return <p className="text-center py-4">Loading requisitions...</p>;
  if (error) return <p className="text-center py-4 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className={`${selectedRequisition ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Requisitions</h2>
            <Link
              to="/dashboard/requisitions/new"
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
            >
              New Requisition
            </Link>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search requisitions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          {/* Status Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({statusCounts.pending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved ({statusCounts.approved})
              </button>
              {user.role?.toLowerCase() === 'finance' && (
  <>
    <button
      onClick={() => setActiveTab(FINANCE_TABS.TO_BE_ACTED)}
      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        activeTab === FINANCE_TABS.TO_BE_ACTED
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      To be Acted Upon ({statusCounts[FINANCE_TABS.TO_BE_ACTED] || 0})
    </button>
    <button
      onClick={() => setActiveTab(FINANCE_TABS.ACTED_UPON)}
      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        activeTab === FINANCE_TABS.ACTED_UPON
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Acted Upon ({statusCounts[FINANCE_TABS.ACTED_UPON] || 0})
    </button>
  </>
)}
              <button
                onClick={() => setActiveTab('rejected')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'rejected'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
              {/* <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({statusCounts.completed})
              </button> */}
            </div>
          </div>

          {/* Requisitions List */}
          <div className="space-y-2">
            {filteredRequisitions.length > 0 ? (
              filteredRequisitions.map(req => (
                <div
                  key={req.id}
                  onClick={() => handleRequisitionClick(req)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                    req.status === 'submitted' ? 'border-l-4 border-l-primary' : ''
                  } ${selectedRequisition?.id === req.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{req.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(req.status).className}`}
                        >
                          {getStatusBadge(req.status).icon}
                          {getStatusBadge(req.status).text}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(req.priority).className}`}
                        >
                          {getPriorityBadge(req.priority).icon}
                          {getPriorityBadge(req.priority).text}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {req.total_amount ? `₦${req.total_amount.toLocaleString()}` : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    From: {req.requester} {req.requesterDetails?.department && `(${req.requesterDetails.department})`}
                  </p>
                  <p className="text-xs text-gray-400">{req.date}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                {`No ${activeTab} requisitions found`}
              </p>
            )}
          </div>
        </div>
      </div>
      {selectedRequisition && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedRequisition.title}</h2>
                <p className="text-sm text-gray-500">
                  From: {selectedRequisition.requester}
                  {selectedRequisition.requesterDetails?.department && ` (${selectedRequisition.requesterDetails.department})`}
                </p>
                <p className="text-xs text-gray-400">Date: {selectedRequisition.date}</p>
                <div className="mt-2 flex gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedRequisition.status).className}`}>
                    {getStatusBadge(selectedRequisition.status).icon}
                    {getStatusBadge(selectedRequisition.status).text}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedRequisition.priority).className}`}>
                    {getPriorityBadge(selectedRequisition.priority).icon}
                    {getPriorityBadge(selectedRequisition.priority).text}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequisition(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{selectedRequisition.description}</p>
            </div>

{/* Items Section */}
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-2">Items</h3>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {selectedRequisition.items && selectedRequisition.items.length > 0 ? (
          selectedRequisition.items.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.name || 'Unnamed Item'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₦{item.unit_price?.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₦{(item.quantity * item.unit_price)?.toLocaleString()}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
              No items added to this requisition
            </td>
          </tr>
        )}
        {selectedRequisition.items && selectedRequisition.items.length > 0 && (
          <tr className="bg-gray-50">
            <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
              Total
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              ₦{selectedRequisition.total_amount?.toLocaleString()}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
{selectedRequisition.attachments && (
  <div className="mt-6 border-t pt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
    <div className="space-y-2">
      {(() => {
        try {
          const attachments = JSON.parse(selectedRequisition.attachments);
          if (!Array.isArray(attachments) || attachments.length === 0) {
            return (
              <p className="text-sm text-gray-500">No attachments found</p>
            );
          }
          
          return attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3 min-w-0">
                {getFileIcon({
                  mimetype: file.mimetype,
                  originalname: file.originalname || file.filename
                })}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalname || file.filename}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                    {file.size > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{formatFileSize(file.size)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <a 
                href={`${BASE_URL}/uploads/${file.filename}`}
                download={file.originalname || file.filename}
                className="text-primary hover:text-primary-dark transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          ));
        } catch (error) {
          console.error('Error parsing attachments:', error);
          return (
            <p className="text-sm text-red-500">Error loading attachments</p>
          );
        }
      })()}
    </div>
  </div>
)}

            {/* Approval status indicators */}
<div className="grid grid-cols-5 gap-2 mb-6">
  {[
    { role: 'manager', label: 'Manager' },
    { role: 'executive', label: 'Executive' },
    { role: 'finance', label: 'Finance' },
    { role: 'gmd', label: 'GMD' },
    { role: 'chairman', label: 'Chairman' }
  ].map(({ role, label }) => {
    const approved = selectedRequisition[`approved_by_${role}`] === 1;
    const rejected = selectedRequisition[`rejected_by_${role}`] === 1;

    return (
      <div
        key={role}
        className={`p-2 rounded text-center text-xs ${
          approved ? 'bg-green-100 text-green-800' :
          rejected ? 'bg-red-100 text-red-800' :
          'bg-gray-100'
        }`}
      >
        <div className="font-medium">{label}</div>
        <div>
          {approved ? 'Approved' : rejected ? 'Rejected' : 'Pending'}
        </div>
      </div>
    );
  })}
</div>

{/* Comment Section */}
{selectedRequisition && (
  <CommentSection 
    requisitionId={selectedRequisition.id} 
    user={user} 
  />
)}

{user.role?.toLowerCase() === 'finance' &&
  activeTab === FINANCE_TABS.TO_BE_ACTED &&
  selectedRequisition.paid_by_finance !== 1 && (
    <div className="mt-6">
      <button
        onClick={() => handlePayRequisition(selectedRequisition)}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Mark as Paid
      </button>
    </div>
  )}

{/* Approval buttons for authorized roles */}
{(() => {
  const userRole = user?.role?.toLowerCase();
  const hasUserApproved = selectedRequisition[`approved_by_${userRole}`] === 1;
  const hasUserRejected = selectedRequisition[`rejected_by_${userRole}`] === 1;
  const hasUserActed = hasUserApproved || hasUserRejected;
  
  // Check if requisition is fully approved (Finance, GMD, and Chairman have all approved)
  const isFullyApproved = selectedRequisition.approved_by_finance === 1 && 
                         selectedRequisition.approved_by_gmd === 1 && 
                         selectedRequisition.approved_by_chairman === 1;
  
  // Check if user is authorized and hasn't acted yet
  const isAuthorized = ['manager', 'executive', 'finance', 'gmd', 'chairman'].includes(userRole);
  const statusAllowsAction = selectedRequisition.status === 'pending' || selectedRequisition.status === 'submitted';
  const canAct = !hasUserActed && statusAllowsAction && !isFullyApproved;
  
  if (!isAuthorized || !canAct) {
    return null;
  }
  
  return (
    <div className="mt-6 space-y-4">
      
{/* Approval Comment Input */}
{showApprovalComment && (
  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
    <h4 className="text-sm font-medium text-blue-800 mb-2">
      {user.role.toLowerCase() === 'chairman' ? 'Approval (Optional)' : 'Recommendation'}
    </h4>
    <textarea
      value={approvalComment}
      onChange={(e) => setApprovalComment(e.target.value)}
      placeholder={
        user.role.toLowerCase() === 'chairman'
          ? "Enter optional remarks for approval..."
          : "Enter your recommendations for approval..."
      }
      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      rows="3"
    />
    <div className="flex justify-end space-x-2 mt-2">
      <button
        onClick={() => {
          setShowApprovalComment(false);
          setApprovalComment('');
        }}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
      >
        Cancel
      </button>
      <button
        onClick={() => handleApprove(selectedRequisition)}
        disabled={user.role.toLowerCase() !== 'chairman' && !approvalComment.trim()}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        Submit Approval
      </button>
    </div>
  </div>
)}

{/* Rejection Comment Input */}
{showRejectionComment && (
  <div className="bg-red-50 p-4 rounded-md border border-red-200">
    <h4 className="text-sm font-medium text-red-800 mb-2">
      {user.role.toLowerCase() === 'chairman' ? 'Rejection (Optional)' : 'Rejection Remark'}
    </h4>
    <textarea
      value={rejectionComment}
      onChange={(e) => setRejectionComment(e.target.value)}
      placeholder={
        user.role.toLowerCase() === 'chairman'
          ? "Enter optional remarks for rejection..."
          : "Enter your remarks for rejection..."
      }
      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
      rows="3"
    />
    <div className="flex justify-end space-x-2 mt-2">
      <button
        onClick={() => {
          setShowRejectionComment(false);
          setRejectionComment('');
        }}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
      >
        Cancel
      </button>
      <button
        onClick={() => handleReject(selectedRequisition)}
        disabled={user.role.toLowerCase() !== 'chairman' && !rejectionComment.trim()}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        Submit Rejection
      </button>
    </div>
  </div>
)}

      {/* Action Buttons */}
      {!showApprovalComment && !showRejectionComment && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowRejectionComment(true);
              setShowApprovalComment(false);
            }}
            disabled={hasUserActed}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              hasUserActed 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50' 
                : 'border-red-500 text-red-500 hover:bg-red-50'
            }`}
          >
            Reject
          </button>
          <button
            onClick={() => {
              setShowApprovalComment(true);
              setShowRejectionComment(false);
            }}
            disabled={hasUserActed}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              hasUserActed 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
})()} 
       </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionList;