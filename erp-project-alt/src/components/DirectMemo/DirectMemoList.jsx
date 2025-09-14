import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Reuse the CommentSection component from the original code
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
        `${BASE_URL}/direct-memos/${memoId}/comments?userId=${user.id}`,
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
        `${BASE_URL}/direct-memos/${memoId}/comments`,
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
        fetchComments();
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

// Reuse file icon and size formatting functions
const getFileIcon = (file) => {
  const fileType = file.mimetype.split('/')[0];
  const extension = file.originalname.split('.').pop().toLowerCase();

  const iconClass = "h-8 w-8 text-gray-400";

  if (file.mimetype === 'application/pdf' || extension === 'pdf') {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  if (file.mimetype.includes('word') || ['doc', 'docx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  if (file.mimetype.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  if (fileType === 'image') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

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

// Helper function to safely handle JSON data (either string or already parsed)
const safeJsonParse = (data, fallback = []) => {
  // If data is null or undefined, return fallback
  if (data == null) {
    return fallback;
  }
  
  // If data is already an array or object, return it
  if (Array.isArray(data) || typeof data === 'object') {
    return data;
  }
  
  // If data is a string, try to parse it
  if (typeof data === 'string') {
    if (data.trim() === '') {
      return fallback;
    }
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('JSON parse error:', error, 'Input:', data);
      return fallback;
    }
  }
  
  // For any other type, return fallback
  return fallback;
};

const DirectMemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('received'); // 'received', 'sent'

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
    const fetchDirectMemos = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/direct-memos/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        const memosArray = response.data;
        console.log('Raw memos data:', memosArray); // Debug log

        const transformedMemos = memosArray.map(memo => {
          // Safely parse JSON fields with fallbacks
          const recipients = safeJsonParse(memo.recipients, []);
          const cc = safeJsonParse(memo.cc, []);
          
          return {
            ...memo,
            sender: users[memo.created_by]?.name || `User ${memo.created_by}`,
            senderDetails: users[memo.created_by],
            isSender: memo.created_by === user.id,
            date: new Date(memo.created_at).toLocaleDateString(),
            status: memo.status || 'sent',
            priority: memo.priority || 'medium',
            recipients: recipients,
            cc: cc,
            isRecipient: recipients.includes(user.id),
            isCC: cc.includes(user.id)
          };
        });

        console.log('Transformed memos:', transformedMemos); // Debug log
        setMemos(transformedMemos);
      } catch (err) {
        console.error('Failed to fetch direct memos:', err);
        setError(err.response?.data?.message || 'Failed to fetch direct memos');
      } finally {
        setLoading(false);
      }
    };

    if (Object.keys(users).length > 0) {
      fetchDirectMemos();
    }
  }, [user, users]);

  // Filter memos based on search term
  const searchFilteredMemos = memos.filter(memo => {
    return (
      memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (memo.content && memo.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Filter memos by tab
  const getFilteredMemosByTab = () => {
    if (activeTab === 'received') {
      return searchFilteredMemos.filter(memo => 
        memo.isRecipient || memo.isCC
      );
    } else if (activeTab === 'sent') {
      return searchFilteredMemos.filter(memo => 
        memo.isSender
      );
    }
    return searchFilteredMemos;
  };

  const filteredMemos = getFilteredMemosByTab();

const handleMemoClick = async (memo) => {
  if (selectedMemo && selectedMemo.id === memo.id) {
    setSelectedMemo(null);
  } else {
    setSelectedMemo(memo);
    
    // Mark as read if user is recipient/CC and memo is unread
    if ((memo.isRecipient || memo.isCC) && memo.status !== 'read') {
      try {
        await axios.post(
          `${BASE_URL}/direct-memos/${memo.id}/read`,
          { user_id: user.id },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        
        // Update the memo status in the list
        setMemos(prev => prev.map(m => 
          m.id === memo.id ? { ...m, status: 'read' } : m
        ));
        
        // Also update selected memo if it's the same one
        if (selectedMemo && selectedMemo.id === memo.id) {
          setSelectedMemo({ ...selectedMemo, status: 'read' });
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  }
};

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'read':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          text: 'Read',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'unread':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Unread',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Sent',
          icon: (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )
        };
    }
  };

  if (loading) return <p className="text-center py-4">Loading direct memos...</p>;
  if (error) return <p className="text-center py-4 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Memo List Panel */}
      <div className={`${selectedMemo ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Direct Memos</h2>
            <Link
              to="/dashboard/direct-memos/new"
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
            >
              New Direct Memo
            </Link>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search direct memos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'received'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Received ({memos.filter(m => m.isRecipient || m.isCC).length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'sent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Sent ({memos.filter(m => m.isSender).length})
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
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${memo.status === 'unread' ? 'border-l-4 border-l-primary bg-blue-50' : ''
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
                        {memo.priority === 'high' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {memo.isSender ? 'To: ' : 'From: '} 
                    {memo.isSender 
                      ? memo.recipients.map(id => users[id]?.name || `User ${id}`).join(', ')
                      : memo.sender
                    }
                    {memo.senderDetails?.department && ` (${memo.senderDetails.department})`}
                  </p>
                  <p className="text-xs text-gray-400">{memo.date}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                {`No ${activeTab} direct memos found`}
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
                <h2 className="text-xl font-bold">{selectedMemo.title}</h2>
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
                  {selectedMemo.priority === 'high' && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                      High Priority
                    </span>
                  )}
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

            {/* Recipients and CC */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">To:</h4>
                <div className="text-sm text-gray-900">
                  {selectedMemo.recipients.map(id => (
                    <div key={id}>
                      {users[id]?.name || `User ${id}`}
                      {users[id]?.department && ` (${users[id].department})`}
                    </div>
                  ))}
                </div>
              </div>
              {selectedMemo.cc && selectedMemo.cc.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">CC:</h4>
                  <div className="text-sm text-gray-900">
                    {selectedMemo.cc.map(id => (
                      <div key={id}>
                        {users[id]?.name || `User ${id}`}
                        {users[id]?.department && ` (${users[id].department})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="prose max-w-none mb-6">
              <pre className="whitespace-pre-wrap font-sans">{selectedMemo.content}</pre>
            </div>

            {selectedMemo.attachments && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {safeJsonParse(selectedMemo.attachments, []).map((file, index) => (
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
                       href={`${BASE_URL}/direct-memos/download/${selectedMemo.id}/${file.filename}?userId=${user.id}`}
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

            {/* Comment Section */}
            {selectedMemo && (
              <CommentSection
                memoId={selectedMemo.id}
                user={user}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMemoList;