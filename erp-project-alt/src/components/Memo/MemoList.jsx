import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const MemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/memos/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (response.data.success) {
          // Transform the API data
          const transformedMemos = response.data.data.map(memo => ({
            ...memo,
            sender: `User ${memo.created_by}`, // Replace with actual username if available
            date: new Date(memo.created_at).toLocaleDateString(),
            status: memo.status || 'submitted',
            priority: 'medium'
          }));
          setMemos(transformedMemos);
        } else {
          setError(response.data.message || 'Failed to fetch memos');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch memos');
      } finally {
        setLoading(false);
      }
    };

    fetchMemos();
  }, [user]);

  const filteredMemos = memos.filter(memo =>
    memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    memo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (memo.content && memo.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMemoClick = (memo) => {
    setSelectedMemo(memo);
  };

  const handleApprove = async (memo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/approve`,
        { user_id: user.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(response.data.message);

        alert(`✅ Success: ${response.data.message}`);
        // Update memo list
        const updatedMemo = { ...memo, status: 'approved' };
        setMemos(prev => prev.map(m => (m.id === memo.id ? updatedMemo : m)));

      }
    } catch (error) {
      console.error('Approval failed:', error.response?.data || error.message);
    }
  };


  const handleReject = async (memo) => {
  if (!memo) return;

  try {
    const response = await axios.post(
      `${BASE_URL}/memos/${memo.id}/reject`,
      { userId: user.id }, // ✅ match backend key
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (response.data?.success) {
      const { field } = response.data;

      const updatedMemos = memos.map(m =>
        m.id === memo.id
          ? {
              ...m,
              status: 'rejected',
              [field]: -1,
            }
          : m
      );

      setMemos(updatedMemos);

      if (selectedMemo?.id === memo.id) {
        setSelectedMemo(prev => ({
          ...prev,
          status: 'rejected',
          [field]: -1,
        }));
      }

      setError(null);
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to reject memo');
  }
};



  const getStatusBadge = (status) => {
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

  if (loading) return <p className="text-center py-4">Loading memos...</p>;
  if (error) return <p className="text-center py-4 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Memo List Panel */}
      <div className={`${selectedMemo ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Memos</h2>
            {user.role !== 'gmd' &&  user.role !== 'chairman' && (
              <Link
                to="/memos/new"
                className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
              >
                New Memo
              </Link>
            )}
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search memos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                    <h3 className="font-medium">{memo.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(memo.status).className}`}>
                      {getStatusBadge(memo.status).icon}
                      {getStatusBadge(memo.status).text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{memo.sender}</p>
                  <p className="text-xs text-gray-400">{memo.date}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No memos found</p>
            )}
          </div>
        </div>
      </div>

      {/* Memo Detail Panel */}
      {selectedMemo && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedMemo.title}</h2>
                <p className="text-sm text-gray-500">From: {selectedMemo.sender}</p>
                <p className="text-xs text-gray-400">Date: {selectedMemo.date}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedMemo.status)}`}>
                    {selectedMemo.status}
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

            {/* Approval status indicators */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_gmd ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                GMD 1: {selectedMemo.approved_by_gmd ? 'Approved' : 'Pending'}
              </div>
              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_gmd2 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                GMD 2: {selectedMemo.approved_by_gmd2 ? 'Approved' : 'Pending'}
              </div>
              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_finance ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                Finance: {selectedMemo.approved_by_finance ? 'Approved' : 'Pending'}
              </div>
              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_chairman ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                Chairman: {selectedMemo.approved_by_chairman ? 'Approved' : 'Pending'}
              </div>
            </div>

            {/* Approval buttons for authorized roles */}
            {/* Approval buttons for authorized roles */}
            {selectedMemo.status === 'submitted' &&
              (user?.role === 'gmd' ||
                user?.role === 'finance' ||
                user?.role === 'gmd2' ||
                user?.role === 'chairman') && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleReject(selectedMemo)}
                    disabled={loading}
                    className={`px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {loading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedMemo)}
                    disabled={loading}
                    className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark ${loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {loading ? 'Processing...' : 'Approve'}
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
