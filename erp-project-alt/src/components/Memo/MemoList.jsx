import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiFileText, FiCheck, FiX, FiClock, FiChevronRight, FiChevronDown, FiPlus, FiSearch } from 'react-icons/fi';

const MemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  const isICTDepartment = (memo) => memo.sender_department?.toLowerCase() === 'ict';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${user.token}` },
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

    const fetchMemos = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/memos/user/${user.id}?role=${user.role}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        const transformedMemos = response.data.map(memo => ({
          ...memo,
          sender: users[memo.created_by]?.name || `User ${memo.created_by}`,
          senderDetails: users[memo.created_by],
          date: new Date(memo.created_at).toLocaleDateString(),
          status: memo.status || 'submitted',
          priority: memo.priority || 'medium',
          acknowledged: isMemoAcknowledgedByUser(memo, user.id),
          isICT: isICTDepartment(memo)
        }));

        setMemos(transformedMemos);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch memos');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    if (Object.keys(users).length > 0) {
      fetchMemos();
    }
  }, [BASE_URL, user.token, user.id, user.role, users]);

  const isMemoAcknowledgedByUser = (memo, userId) => {
    if (!memo.acknowledgments) return false;
    const acks = Array.isArray(memo.acknowledgments) ? memo.acknowledgments : [];
    return acks.some(a => typeof a === 'object' && a.id === userId);
  };

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (memo.content && memo.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    switch (activeTab) {
      case 'pending':
        return matchesSearch && (memo.status === 'submitted' || memo.status === 'pending');
      case 'approved':
        return matchesSearch && memo.status === 'approved';
      case 'rejected':
        return matchesSearch && memo.status === 'rejected';
      case 'acted':
        return matchesSearch && memo.status === 'acted';
      default:
        return matchesSearch;
    }
  });

  const handleMemoClick = (memo) => {
    setSelectedMemo({
      ...memo,
      acknowledged: isMemoAcknowledgedByUser(memo, user.id)
    });
  };

  const handleApprove = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/approve`,
        { user_id: user.id, role: user.role },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (response.status === 200) {
        const updatedMemo = {
          ...memo,
          ...response.data.updatedFields,
          status: response.data.status || memo.status
        };
        setMemos(prev => prev.map(m => m.id === memo.id ? updatedMemo : m));
        setSelectedMemo(updatedMemo);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert(`❌ Error: ${error.response?.data?.message || 'Approval failed'}`);
    }
  };

  const handleReject = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/reject`,
        { userId: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (response.data?.success) {
        const updatedMemos = memos.map(m =>
          m.id === memo.id ? { ...m, status: 'rejected' } : m
        );
        setMemos(updatedMemos);
        setSelectedMemo(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject memo');
    }
  };

  const handleMarkAsActed = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/act`,
        { user_id: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (response.status === 200) {
        const updatedMemo = { ...memo, status: 'acted' };
        setMemos(prev => prev.map(m => m.id === memo.id ? updatedMemo : m));
        setSelectedMemo(updatedMemo);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert(`❌ Error: ${error.response?.data?.message || 'Action failed'}`);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
    
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          className: `${baseClasses} bg-green-100 text-green-800 border-green-200`,
          text: 'Approved',
          icon: <FiCheck className="h-3 w-3 mr-1" />
        };
      case 'rejected':
        return {
          className: `${baseClasses} bg-red-100 text-red-800 border-red-200`,
          text: 'Rejected',
          icon: <FiX className="h-3 w-3 mr-1" />
        };
      case 'acted':
        return {
          className: `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`,
          text: 'Acted Upon',
          icon: <FiCheck className="h-3 w-3 mr-1" />
        };
      default:
        return {
          className: `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`,
          text: 'Pending',
          icon: <FiClock className="h-3 w-3 mr-1" />
        };
    }
  };

  const getMemoTypeBadge = (type) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
    return type === 'report' 
      ? { text: 'Report', className: `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300` }
      : { text: 'Normal', className: `${baseClasses} bg-blue-100 text-blue-800 border-blue-300` };
  };

  const shouldShowApprovalSection = (memo) => {
    if (memo.status !== 'submitted') return false;
    
    if (memo.isICT) {
      return (user.role === 'manager' && !memo.approved_by_manager) ||
             (user.role === 'executive' && memo.approved_by_manager && !memo.approved_by_executive) ||
             (user.role === 'finance' && memo.approved_by_executive && !memo.approved_by_finance) ||
             (user.role === 'gmd' && memo.approved_by_finance && !memo.approved_by_gmd) ||
             (user.role === 'chairman' && memo.approved_by_gmd && !memo.approved_by_chairman);
    }
    
    return (user.role === 'finance' && !memo.approved_by_finance) ||
           (user.role === 'gmd' && memo.approved_by_finance && !memo.approved_by_gmd) ||
           (user.role === 'chairman' && memo.approved_by_gmd && !memo.approved_by_chairman);
  };

  const isFullyApproved = (memo) => {
    if (memo.isICT) {
      return memo.approved_by_manager && memo.approved_by_executive && memo.approved_by_finance && memo.approved_by_gmd && memo.approved_by_chairman;
    }
    return memo.approved_by_finance && memo.approved_by_gmd && memo.approved_by_chairman;
  };

  const renderApprovalStatus = (memo) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 border-t pt-4">
        {memo.isICT && (
          <>
            <div className={`p-2 rounded text-center text-xs ${
              memo.approved_by_manager ? 'bg-green-100 text-green-800' :
              memo.rejected_by_manager ? 'bg-red-100 text-red-800' :
              'bg-gray-100'
            }`}>
              <div className="font-medium">Line Manager</div>
              <div>
                {memo.approved_by_manager ? 'Approved' : 
                 memo.rejected_by_manager ? 'Rejected' : 'Pending'}
              </div>
            </div>
            <div className={`p-2 rounded text-center text-xs ${
              memo.approved_by_executive ? 'bg-green-100 text-green-800' :
              memo.rejected_by_executive ? 'bg-red-100 text-red-800' :
              'bg-gray-100'
            }`}>
              <div className="font-medium">Executive</div>
              <div>
                {memo.approved_by_executive ? 'Approved' : 
                 memo.rejected_by_executive ? 'Rejected' : 'Pending'}
              </div>
            </div>
          </>
        )}
        
        <div className={`p-2 rounded text-center text-xs ${
          memo.approved_by_finance ? 'bg-green-100 text-green-800' :
          memo.rejected_by_finance ? 'bg-red-100 text-red-800' :
          'bg-gray-100'
        }`}>
          <div className="font-medium">Finance</div>
          <div>
            {memo.approved_by_finance ? 'Approved' : 
             memo.rejected_by_finance ? 'Rejected' : 'Pending'}
          </div>
        </div>
        
        <div className={`p-2 rounded text-center text-xs ${
          memo.approved_by_gmd ? 'bg-green-100 text-green-800' :
          memo.rejected_by_gmd ? 'bg-red-100 text-red-800' :
          'bg-gray-100'
        }`}>
          <div className="font-medium">GMD</div>
          <div>
            {memo.approved_by_gmd ? 'Approved' : 
             memo.rejected_by_gmd ? 'Rejected' : 'Pending'}
          </div>
        </div>
        
        <div className={`p-2 rounded text-center text-xs ${
          memo.approved_by_chairman ? 'bg-green-100 text-green-800' :
          memo.rejected_by_chairman ? 'bg-red-100 text-red-800' :
          'bg-gray-100'
        }`}>
          <div className="font-medium">Chairman</div>
          <div>
            {memo.approved_by_chairman ? 'Approved' : 
             memo.rejected_by_chairman ? 'Rejected' : 'Pending'}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse text-gray-500">Loading memos...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex items-center text-red-700">
        <FiX className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Memo List Panel */}
      <div className={`${selectedMemo ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Memos</h2>
            {user.role !== 'gmd' && user.role !== 'chairman' && (
              <Link
                to="/dashboard/memos/new"
                className="flex items-center px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors"
              >
                <FiPlus className="h-4 w-4 mr-1" />
                New Memo
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'approved' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'rejected' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rejected
            </button>
            {user.role === 'finance' && (
              <button
                onClick={() => setActiveTab('acted')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'acted' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Acted Upon
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search memos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredMemos.length > 0 ? (
              filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  onClick={() => handleMemoClick(memo)}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedMemo?.id === memo.id ? 'bg-gray-50 border-primary' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{memo.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className={getStatusBadge(memo.status).className}>
                          {getStatusBadge(memo.status).icon}
                          {getStatusBadge(memo.status).text}
                        </span>
                        <span className={getMemoTypeBadge(memo.memo_type).className}>
                          {getMemoTypeBadge(memo.memo_type).text}
                        </span>
                      </div>
                    </div>
                    <FiChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    From: {memo.sender} {memo.senderDetails?.department && `(${memo.senderDetails.department})`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{memo.date}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiFileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>No memos found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Memo Detail Panel */}
      {selectedMemo && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  {selectedMemo.title}
                  {selectedMemo.memo_type === 'report' && selectedMemo.acknowledged && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <FiCheck className="h-3 w-3" />
                      Acknowledged
                    </span>
                  )}
                </h2>

                <div className="flex items-center gap-2 mt-2">
                  <span className={getStatusBadge(selectedMemo.status).className}>
                    {getStatusBadge(selectedMemo.status).icon}
                    {getStatusBadge(selectedMemo.status).text}
                  </span>
                  <span className={getMemoTypeBadge(selectedMemo.memo_type).className}>
                    {getMemoTypeBadge(selectedMemo.memo_type).text}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <p>From: {selectedMemo.sender} {selectedMemo.senderDetails?.department && `(${selectedMemo.senderDetails.department})`}</p>
                  <p>Date: {selectedMemo.date}</p>
                  <p className="mt-1">Priority: <span className="capitalize">{selectedMemo.priority}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemo(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="prose max-w-none mb-6 border-t pt-4">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">{selectedMemo.content}</pre>
            </div>

            {renderApprovalStatus(selectedMemo)}

            {/* Approval buttons */}
            {shouldShowApprovalSection(selectedMemo) && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleReject(selectedMemo)}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedMemo)}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            {/* Act Upon button for finance */}
            {user.role === 'finance' && isFullyApproved(selectedMemo) && selectedMemo.status !== 'acted' && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => handleMarkAsActed(selectedMemo)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Mark as Acted Upon
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoList;