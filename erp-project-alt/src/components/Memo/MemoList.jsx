import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const MemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const [memos, setMemos] = useState([]);
  const [acknowledgments, setAcknowledgments] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [sendDirectly, setSendDirectly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [memosResponse, usersResponse] = await Promise.all([
          axios.get(`${BASE_URL}/memos/user/${user.id}?role=${user.role}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${BASE_URL}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        ]);

        const memosArray = memosResponse.data;
        const usersData = usersResponse.data;

        const usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});

        setUsers(usersMap);

        const transformedMemos = memosArray.map(memo => ({
          ...memo,
          sender: usersMap[memo.created_by]?.name || `User ${memo.created_by}`,
          date: new Date(memo.created_at).toLocaleDateString(),
          status: memo.status || 'submitted',
          priority: memo.priority || 'medium',
          acknowledged: isMemoAcknowledgedByUser(memo, user.id)
        }));

        setMemos(transformedMemos);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch memos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

const filteredMemos = memos.filter(memo => {
  const isFinanceCreator = memo.sender_department?.toLowerCase() === 'finance';
  const isNotIctCreator = memo.department?.toLowerCase() !== 'ict';
  
  return (
    memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    memo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (memo.content && memo.content.toLowerCase().includes(searchTerm.toLowerCase()))
    // You can also include your conditions here if needed:
    // && isFinanceCreator
    // && isNotIctCreator
  );
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
        alert(`✅ Success: ${response.data.message}`);
        const updatedMemo = {
          ...memo,
          ...response.data.updatedFields,
          status: response.data.status || memo.status
        };
        setMemos(prev => prev.map(m => m.id === memo.id ? updatedMemo : m));
        setSelectedMemo(updatedMemo);

        if (response.data.nextApprover) {
          alert(`Next approver: ${response.data.nextApprover}`);
        }
      }
    } catch (error) {
      console.error('Approval failed:', error.response?.data || error.message);
      alert(`❌ Error: ${error.response?.data?.message || 'Approval failed'}`);
    }
  };



  // const handleApprove = async (memo) => {
  //   try {
  //     const response = await axios.post(
  //       `${BASE_URL}/memos/${memo.id}/approve`,
  //       {
  //         user_id: user.id,
  //         role: user.role, // ✅ pass the role

  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${user.token}`,
  //         },
  //       }
  //     );

  //     if (response.status === 200) {
  //       alert(`✅ Success: ${response.data.message}`);
  //       const updatedMemo = { ...memo, ...response.data.updatedFields, status: 'approved' };
  //       setMemos(prev => prev.map(m => (m.id === memo.id ? updatedMemo : m)));
  //       setSelectedMemo(updatedMemo)
  //     }
  //   } catch (error) {
  //     console.error('Approval failed:', error.response?.data || error.message);
  //     alert(`❌ Error: ${error.response?.data?.message || 'Approval failed'}`);
  //   }
  // };

  const handleReject = async (memo) => {
    if (!memo) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/memos/${memo.id}/reject`,
        { userId: user.id },
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

  if (loading) return <p className="text-center py-4">Loading memos...</p>;
  if (error) return <p className="text-center py-4 text-red-500">{error}</p>;

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
                <p className="text-sm text-gray-500">From: {selectedMemo.sender}</p>
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

            {/* Approval status indicators */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_manager === 1
                ? 'bg-green-100 text-green-800'
                : selectedMemo.approved_by_manager === -1
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100'
                }`}>
                Manager: {
                  selectedMemo.approved_by_manager === 1
                    ? 'Approved'
                    : selectedMemo.approved_by_manager === -1
                      ? 'Rejected'
                      : 'Pending'
                }
              </div>

              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_executive === 1
                ? 'bg-green-100 text-green-800'
                : selectedMemo.approved_by_executive === -1
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100'
                }`}>
                Executive: {
                  selectedMemo.approved_by_executive === 1
                    ? 'Approved'
                    : selectedMemo.approved_by_executive === -1
                      ? 'Rejected'
                      : 'Pending'
                }
              </div>

              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_finance === 1
                ? 'bg-green-100 text-green-800'
                : selectedMemo.approved_by_finance === -1
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100'
                }`}>
                Finance: {
                  selectedMemo.approved_by_finance === 1
                    ? 'Approved'
                    : selectedMemo.approved_by_finance === -1
                      ? 'Rejected'
                      : 'Pending'
                }
              </div>

              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_gmd === 1
                ? 'bg-green-100 text-green-800'
                : selectedMemo.approved_by_gmd === -1
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100'
                }`}>
                GMD: {
                  selectedMemo.approved_by_gmd === 1
                    ? 'Approved'
                    : selectedMemo.approved_by_gmd === -1
                      ? 'Rejected'
                      : 'Pending'
                }
              </div>

              <div className={`p-2 rounded text-center text-xs ${selectedMemo.approved_by_chairman === 1
                ? 'bg-green-100 text-green-800'
                : selectedMemo.approved_by_chairman === -1
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100'
                }`}>
                Chairman: {
                  selectedMemo.approved_by_chairman === 1
                    ? 'Approved'
                    : selectedMemo.approved_by_chairman === -1
                      ? 'Rejected'
                      : 'Pending'
                }
              </div>
            </div>

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
                        {a.name} — {a.role} ({a.dept})
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Approval buttons for authorized roles */}
            {selectedMemo.status === 'submitted' &&
              (user?.role === 'manager' ||
                user?.role === 'executive' ||
                user?.role === 'finance' ||
                user?.role === 'gmd' ||
                user?.role === 'chairman') && (
                <div className="mt-6 space-y-4">
                  {/* Show checkbox for executive, finance, and GMD to send directly to chairman */}
                  {(user?.role === 'executive' || user?.role === 'finance' || user?.role === 'gmd') && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendDirectly"
                        checked={console.log("hi")}
                        onChange={console.log("hi")}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="sendDirectly" className="ml-2 block text-sm text-gray-700">
                        Send directly to Chairman
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
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
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoList;