import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Add CommentSection component for memos
const CommentSection = ({ memoId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchComments();
  }, [memoId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/memos/${memoId}/comments`,
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
        `${BASE_URL}/memos/${memoId}/comments`,
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
                <div className="font-medium text-sm text-gray-800">{comment.user_name}</div>
                <div className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              <p className="text-sm mt-2 text-gray-700">{comment.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4"></p>
        )}
      </div>
    </div>
  );
};

// Add finance tabs constants
const FINANCE_TABS = {
  TO_BE_ACTED: 'to_be_acted',
  ACTED_UPON: 'acted_upon'
};

const getFileIcon = (file) => {
  const fileType = file.mimetype.split('/')[0];
  const extension = file.originalname.split('.').pop().toLowerCase();

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
  if (file.mimetype.includes('word') || ['doc', 'docx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Excel
  if (file.mimetype.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const { memoId } = useParams();
  const [acknowledgments, setAcknowledgments] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // Changed default to 'pending'
  const [financeActionedMemos, setFinanceActionedMemos] = useState([]);
  // Add state for decision comments
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [showApprovalComment, setShowApprovalComment] = useState(false);
  const [showRejectionComment, setShowRejectionComment] = useState(false);


  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

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
    const fetchMemos = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/memos/user/${user.id}?role=${user.role}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        const memosArray = response.data;

        const transformedMemos = memosArray.map(memo => ({
          ...memo,
          sender: users[memo.created_by]?.name || `User ${memo.created_by}`,
          senderDetails: users[memo.created_by],
          isSender: memo.created_by === user.id,
          date: new Date(memo.created_at).toLocaleDateString(),
          status: memo.status || 'submitted',
          priority: memo.priority || 'medium',
          acknowledged: isMemoAcknowledgedByUser(memo, user.id),
          paid_by_finance: memo.paid_by_finance === 1
        }));

        setMemos(transformedMemos);
        const paidMemoIds = transformedMemos
          .filter(m => m.paid_by_finance)
          .map(m => m.id);
        setFinanceActionedMemos(paidMemoIds);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch memos');
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [user, users]);

  useEffect(() => {
    if (memoId && memos.length > 0) {
      const memoToOpen = memos.find(m => m.id === parseInt(memoId));
      if (memoToOpen) {
        setSelectedMemo(memoToOpen);
      }
    }
  }, [memoId, memos]);


  // Filter memos based on search term
  const searchFilteredMemos = memos.filter(memo => {
    return (
      memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (memo.content && memo.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Helper function to check if memo is approved
  const isMemoApproved = (memo) => {
    if (memo.created_by === user.id) {
      return memo.approved_by_manager === 1 ||
        memo.approved_by_executive === 1 ||
        memo.approved_by_finance === 1 ||
        memo.approved_by_gmd === 1 ||
        memo.approved_by_chairman === 1;
    }
    const roleField = `approved_by_${user.role}`;
    const isFinalApproval = memo.approved_by_chairman === 1;

    // For senders - show only fully approved AND paid memos
    if (memo.created_by === user.id) {
      return memo.approved_by_chairman === 1 && financeActionedMemos.includes(memo.id);
    }

    // Approved tab shows if:
    // - This user's role has approved
    // - Or final approval has been given
    return memo[roleField] === 1 || isFinalApproval;
  };

  // Helper function to check if memo is rejected
  const isMemoRejected = (memo) => {
    return memo.status.toLowerCase() === 'rejected' ||
      memo.rejected_by_chairman === 1 ||
      memo.rejected_by_gmd === 1 ||
      memo.rejected_by_finance === 1 ||
      memo.rejected_by_executive === 1 ||
      memo.rejected_by_manager === 1;
  };

  // Helper function to check if memo is completed
  const isMemoCompleted = (memo) => {
    return memo.status.toLowerCase() === 'completed';
  };

  // Add this function to filter memos for finance tabs
  const getFinanceFilteredMemos = (tab) => {
    if (user.role?.toLowerCase() !== 'finance') return [];

    const chairmanApprovedMemos = searchFilteredMemos.filter(
      memo => memo.approved_by_chairman === 1
    );

    if (tab === FINANCE_TABS.TO_BE_ACTED) {
      return chairmanApprovedMemos.filter(
        memo => !financeActionedMemos.includes(memo.id)
      );
    } else if (tab === FINANCE_TABS.ACTED_UPON) {
      return chairmanApprovedMemos.filter(
        memo => financeActionedMemos.includes(memo.id)
      );
    }

    return [];
  };

  // Filter memos by status based on active tab
  const getFilteredMemosByStatus = () => {
    // Handle finance-specific tabs
    if (user.role?.toLowerCase() === 'finance' &&
      (activeTab === FINANCE_TABS.TO_BE_ACTED || activeTab === FINANCE_TABS.ACTED_UPON)) {
      return getFinanceFilteredMemos(activeTab);
    }

    switch (activeTab) {
      case 'pending':
        return searchFilteredMemos.filter(memo => {
          if (memo.created_by === user.id) {
            return !isMemoApproved(memo) &&
              !isMemoRejected(memo) &&
              !isMemoCompleted(memo);
          }
          const roleField = `approved_by_${user.role}`;
          const rejectField = `rejected_by_${user.role}`;
          return memo[roleField] !== 1 && memo[rejectField] !== 1 && !isMemoCompleted(memo);
        });
      case 'approved':
        return searchFilteredMemos.filter(memo =>
          isMemoApproved(memo) && !isMemoCompleted(memo)
        );
      case 'rejected':
        return searchFilteredMemos.filter(memo =>
          isMemoRejected(memo) && !isMemoCompleted(memo)
        );
      case 'completed':
        return searchFilteredMemos.filter(memo =>
          isMemoCompleted(memo)
        );
      default:
        return searchFilteredMemos.filter(memo =>
          (memo.status.toLowerCase() === 'pending' ||
            memo.status.toLowerCase() === 'submitted') &&
          !isMemoApproved(memo) &&
          !isMemoRejected(memo) &&
          !isMemoCompleted(memo)
        );
    }
  };

  const filteredMemos = getFilteredMemosByStatus();

  // Get counts for each status
  const getStatusCounts = () => {
  // Use the same logic as getFilteredMemosByStatus()
  const pending = searchFilteredMemos.filter(memo => {
    if (memo.created_by === user.id) {
      return !isMemoApproved(memo) &&
        !isMemoRejected(memo) &&
        !isMemoCompleted(memo);
    }
    const roleField = `approved_by_${user.role}`;
    const rejectField = `rejected_by_${user.role}`;
    return memo[roleField] !== 1 && memo[rejectField] !== 1 && !isMemoCompleted(memo);
  }).length;

  const approved = searchFilteredMemos.filter(memo =>
    isMemoApproved(memo) && !isMemoCompleted(memo)
  ).length;

  const rejected = searchFilteredMemos.filter(memo =>
    isMemoRejected(memo) && !isMemoCompleted(memo)
  ).length;

  const completed = searchFilteredMemos.filter(memo =>
    isMemoCompleted(memo)
  ).length;

  // Add finance-specific counts if user is finance
  const counts = { pending, approved, rejected, completed };

  if (user.role?.toLowerCase() === 'finance') {
    const chairmanApproved = searchFilteredMemos.filter(
      memo => memo.approved_by_chairman === 1
    );

    counts[FINANCE_TABS.TO_BE_ACTED] = chairmanApproved.filter(
      memo => !financeActionedMemos.includes(memo.id)
    ).length;

    counts[FINANCE_TABS.ACTED_UPON] = chairmanApproved.filter(
      memo => financeActionedMemos.includes(memo.id)
    ).length;
  }

  return counts;
};

  const statusCounts = getStatusCounts();

  const handleMemoClick = (memo) => {
    if (selectedMemo && selectedMemo.id === memo.id) {
      setSelectedMemo(null);
      navigate('/dashboard/memos');
    } else {
      setSelectedMemo({
        ...memo,
        acknowledged: isMemoAcknowledgedByUser(memo, user.id)
      });
      navigate(`/dashboard/memos/${memo.id}`);
    }
  };

  // Add this function to handle the Pay action for memos
  const handlePay = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/pay`,
        { user_id: user.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        alert('Payment processed successfully!');

        const updatedMemos = memos.map(m =>
          m.id === memo.id
            ? { ...m, paid_by_finance: 1, status: 'completed' }
            : m
        );
        setMemos(updatedMemos);

        setFinanceActionedMemos(prev => [...prev, memo.id]);
        setSelectedMemo(null);
      }
    } catch (error) {
      console.error('Payment failed:', error.response?.data || error.message);
      alert(`❌ Error: ${error.response?.data?.message || 'Payment failed'}`);
    }
  };

const handleApprove = async (memo) => {
  if (!approvalComment.trim()) {
    alert('Please add recommendations for approval');
    return;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/memos/${memo.id}/approve`,
      {
        user_id: user.id,
        role: user.role,
      },
      {
        headers: {
          Authorization: user?.token ? `Bearer ${user.token}` : '',
        },
      }
    );

    if (response.status === 200) {
      // Add approval comment
      await axios.post(
        `${BASE_URL}/memos/${memo.id}/comments`,
        {
          comment: `Recommendation: ${approvalComment}`,
          user_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert(`✅ Success: ${response.data.message}`);
      const updatedMemo = {
        ...memo,
        ...response.data.updatedFields,
        status: response.data.updatedFields.status || memo.status,
        [`approved_by_${user.role}`]: 1,
        [`rejected_by_${user.role}`]: 0
      };

      setMemos(prev =>
        prev.map(m => Number(m.id) === Number(memo.id) ? updatedMemo : m)
      );

      setSelectedMemo(null); // Close the memo view
      setApprovalComment('');
      setShowApprovalComment(false);

      if (response.data.nextApprover) {
        alert(`Next approver: ${response.data.nextApprover}`);
      }
    }
  } catch (error) {
    console.error('Approval failed:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.details
      ? `${error.response.data.message}: ${error.response.data.details}`
      : error.response?.data?.message || 'Approval failed';
    alert(`❌ Error: ${errorMessage}`);
  }
};

const handleReject = async (memo) => {
  if (!rejectionComment.trim()) {
    alert('Please add remarks for rejection');
    return;
  }

  if (!memo) return;

  try {
    const response = await axios.post(
      `${BASE_URL}/memos/${memo.id}/reject`,
      { userId: user.id },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    if (response.data?.success) {
      // Add rejection comment
      await axios.post(
        `${BASE_URL}/memos/${memo.id}/comments`,
        {
          comment: `Rejection Remark: ${rejectionComment}`,
          user_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const { field, rejectedBy, message } = response.data;

      const updatedMemos = memos.map((m) =>
        m.id === memo.id
          ? {
            ...m,
            status: 'rejected',
            [field]: 1,
            rejected_by_name: rejectedBy,
          }
          : m
      );

      setMemos(updatedMemos);
      setSelectedMemo(null); // Close the memo view
      setRejectionComment('');
      setShowRejectionComment(false);
      console.log(message);
    }
  } catch (err) {
    console.error('Reject error:', err);
    setError(err.response?.data?.message || 'Failed to reject memo');
  }
};


  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm("Are you sure you want to delete this memo?")) return;

    try {
      const response = await axios.delete(`${BASE_URL}/memos/${memoId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.status === 200) {
        alert("✅ Memo deleted successfully");
        setMemos((prev) => prev.filter((m) => m.id !== memoId));
        setSelectedMemo(null);
      }
    } catch (error) {
      console.error("Failed to delete memo:", error);
      alert(`❌ Error: ${error.response?.data?.message || "Delete failed"}`);
    }
  };


  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('approved') && statusLower.includes('submitted')) {
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        text: 'Approved & Submitted',
        icon: (
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      };
    }
    switch (status.toLowerCase()) {
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

  const handleAcknowledge = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/acknowledge`,
        { user_id: user.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        alert(`✅ Acknowledged: ${response.data.message}`);

        let updatedAcks = response.data.acknowledgments;
        if (typeof updatedAcks === 'string') {
          try {
            updatedAcks = JSON.parse(updatedAcks);
          } catch (err) {
            updatedAcks = [];
          }
        }

        // Map acknowledgment user IDs to names
        updatedAcks = updatedAcks.map(ack => {
          if (typeof ack === 'object' && ack.id) {
            return {
              ...ack,
              name: users[ack.id]?.name || `User ${ack.id}`
            };
          }
          return ack;
        });

        const updatedMemo = {
          ...memo,
          acknowledged: true,
          acknowledgments: updatedAcks
        };

        setSelectedMemo(updatedMemo);
        setMemos(prev => prev.map(m => (m.id === memo.id ? updatedMemo : m)));
      }
    } catch (error) {
      console.error('Acknowledgment failed:', error);
      alert(`❌ Error: ${error.response?.data?.message || 'Acknowledgment failed'}`);
    }
  };

  const isMemoAcknowledgedByUser = (memo, userId) => {
    if (!memo.acknowledgments) return false;
    const acks = Array.isArray(memo.acknowledgments)
      ? memo.acknowledgments
      : [];
    return acks.some(a => typeof a === 'object' && a.id === userId);
  };

  if (loading) return <p className="text-center py-4">Loading memos...</p>;
  if (error) return <p className="text-center py-4 text-red-500">{error}</p>;

  const getMemoTypeBadge = (type) => {
    if (type === 'report') {
      return {
        text: 'Report',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      };
    }
    return {
      text: 'Normal',
      className: 'bg-blue-100 text-blue-800 border border-blue-300'
    };
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Memo List Panel */}
      <div className={`${selectedMemo ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Memos</h2>
            {user.role !== 'gmd' && user.role !== 'chairman' && (
              <Link
                to="/dashboard/memos/new"
                className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
              >
                New Memo
              </Link>
            )}
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search memos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Updated Status Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'pending'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Pending ({statusCounts.pending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'approved'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Approved ({statusCounts.approved})
              </button>

              {/* Finance-specific tabs */}
              {user.role?.toLowerCase() === 'finance' && (
                <>
                  <button
                    onClick={() => setActiveTab(FINANCE_TABS.TO_BE_ACTED)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === FINANCE_TABS.TO_BE_ACTED
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    To be Acted Upon ({statusCounts[FINANCE_TABS.TO_BE_ACTED] || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab(FINANCE_TABS.ACTED_UPON)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === FINANCE_TABS.ACTED_UPON
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
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'rejected'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
            </div>
          </div>

          {/* Memos List */}
          <div className="space-y-2">
            {filteredMemos.length > 0 ? (
              filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  onClick={() => handleMemoClick(memo)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${memo.status === 'submitted' ? 'border-l-4 border-l-primary' : ''
                    } ${selectedMemo?.id === memo.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{memo.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(memo.status).className}`}
                        >
                          {getStatusBadge(memo.status).icon}
                          {getStatusBadge(memo.status).text}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMemoTypeBadge(memo.memo_type).className}`}
                        >
                          {getMemoTypeBadge(memo.memo_type).text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    From: {memo.sender} {memo.senderDetails?.department && `(${memo.senderDetails.department})`}
                  </p>
                  <p className="text-xs text-gray-400">{memo.date}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                {`No ${activeTab} memos found`}
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedMemo && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {selectedMemo.title}
                  {selectedMemo.memo_type === 'report' && selectedMemo.acknowledged && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Acknowledged
                    </span>
                  )}
                </h2>

                <p className="text-sm text-gray-500">
                  From: {selectedMemo.sender}
                  {selectedMemo.senderDetails?.department && ` (${selectedMemo.senderDetails.department})`}
                </p>
                <p className="text-xs text-gray-400">Date: {selectedMemo.date}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedMemo.status).className}`}>
                    {getStatusBadge(selectedMemo.status).icon}
                    {getStatusBadge(selectedMemo.status).text}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemo(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="prose max-w-none mb-6">
              <pre className="whitespace-pre-wrap font-sans">{selectedMemo.content}</pre>
            </div>

            {selectedMemo.attachments && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {JSON.parse(selectedMemo.attachments).map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        {getFileIcon(file)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.originalname}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="mx-2">•</span>
                            <span>{file.mimetype.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${BASE_URL}/memos/download/${selectedMemo.id}/${file.filename}`}
                        download={file.originalname}
                        className="text-primary hover:text-primary-dark transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  ))}
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
                const approved = selectedMemo[`approved_by_${role}`] === 1;
                const rejected = selectedMemo[`rejected_by_${role}`] === 1;

                return (
                  <div
                    key={role}
                    className={`p-2 rounded text-center text-xs ${approved ? 'bg-green-100 text-green-800' :
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
            {selectedMemo && (
              <CommentSection
                memoId={selectedMemo.id}
                user={user}
              />
            )}

            {/* Pay button for finance users on to-be-acted items */}
            {user.role?.toLowerCase() === 'finance' &&
              activeTab === FINANCE_TABS.TO_BE_ACTED &&
              !financeActionedMemos.includes(selectedMemo.id) && (
                <div className="mt-6">
                  <button
                    onClick={() => handlePay(selectedMemo)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Pay
                  </button>
                </div>
              )}

            {/* Acknowledgment checkbox for reports */}
            {selectedMemo.memo_type === 'report' && !selectedMemo.acknowledged && (
              <div className="mt-6 border-t pt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleAcknowledge(selectedMemo);
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700">I acknowledge this memo</span>
                </label>
              </div>
            )}

            {selectedMemo.memo_type === 'report' && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Pending Acknowledgment From:</h4>
                <ul className="list-disc list-inside text-sm text-gray-500">
                  {selectedMemo.acknowledgments
                    .filter(a => typeof a === 'string')
                    .map((role, idx) => (
                      <li key={idx}>{role}</li>
                    ))}
                </ul>
              </div>
            )}

            {selectedMemo.memo_type === 'report' && selectedMemo.acknowledgments?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Acknowledged by:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {selectedMemo.acknowledgments
                    .filter(a => typeof a === 'object')
                    .map((a) => (
                      <li key={a.id}>
                        {a.name} — {a.role} {a.dept && `(${a.dept})`}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Approval buttons for authorized roles */}
            {(() => {
              const userRole = user?.role?.toLowerCase();

              // Debug logging
              console.log('=== DEBUG APPROVAL BUTTON ===');
              console.log('User role:', userRole);
              console.log('Memo status:', selectedMemo.status);
              console.log('Memo data:', selectedMemo);

              // Normalize role for all executive variations
              const normalizeRole = (role) => {
                if (!role) return role;
                if (role.includes('executive') || role.includes('ict')) {
                  return 'executive';
                }
                return role;
              };

              const normalizedRole = normalizeRole(userRole);
              console.log('Normalized role:', normalizedRole);

              const hasUserApproved = selectedMemo[`approved_by_${normalizedRole}`] === 1;
              const hasUserRejected = selectedMemo[`rejected_by_${normalizedRole}`] === 1;
              const hasUserActed = hasUserApproved || hasUserRejected;

              console.log('Approval status:', hasUserApproved);
              console.log('Rejection status:', hasUserRejected);

              // Check if user is authorized 
              const isExecutive = userRole?.includes('executive') || userRole?.includes('ict');
              const isAuthorized = ['manager', 'finance', 'gmd', 'chairman'].includes(userRole) || isExecutive;

              // Allow action if status is pending/submitted OR if it's in_review   
              const statusAllowsAction = ['pending', 'submitted', 'in_review'].includes(selectedMemo.status);
              const canAct = !hasUserActed && statusAllowsAction;

              // Special case for chairman
              const isChairman = userRole === 'chairman';
              const canChairmanApprove = isChairman && !hasUserApproved && !hasUserRejected;

              console.log('Is authorized:', isAuthorized);
              console.log('Status allows action:', statusAllowsAction);
              console.log('Can act:', canAct);
              console.log('Is chairman:', isChairman);
              console.log('Can chairman approve:', canChairmanApprove);

              // Show buttons if authorized and can act, OR if chairman can approve
              const shouldShowButtons = (isAuthorized && canAct) || canChairmanApprove;

              console.log('Should show buttons:', shouldShowButtons);
              console.log('=== END DEBUG ===');

              if (!shouldShowButtons) {
                return null;
              }

              return (
                <div className="mt-6 space-y-4">
                  {/* Approval Comment Input */}
                  {showApprovalComment && (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendation</h4>
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Enter your recommendations for approval..."
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
                          onClick={() => handleApprove(selectedMemo)}
                          disabled={!approvalComment.trim()}
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
                      <h4 className="text-sm font-medium text-red-800 mb-2">Rejection Remark</h4>
                      <textarea
                        value={rejectionComment}
                        onChange={(e) => setRejectionComment(e.target.value)}
                        placeholder="Enter your remarks for rejection..."
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
                          onClick={() => handleReject(selectedMemo)}
                          disabled={!rejectionComment.trim()}
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
                        disabled={hasUserActed && !isChairman}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${(hasUserActed && !isChairman)
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
                        disabled={hasUserActed && !isChairman}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${(hasUserActed && !isChairman)
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

export default MemoList;