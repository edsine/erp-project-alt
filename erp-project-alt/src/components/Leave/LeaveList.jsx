import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext';
import { 
  FiPlus, FiSearch, FiX, FiCalendar, FiUser,
  FiCheck, FiClock, FiAlertCircle, FiChevronRight
} from 'react-icons/fi';

const LeaveList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [users, setUsers] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([])
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const usersData = await response.json();

        const usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});

        setUsers(usersMap);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    fetchUsers();
  }, []);

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`${BASE_URL}/leave/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error fetching leave data');
        }

        const data = await response.json();
        setLeaves(data);
      } catch (err) {
        console.error('Failed to fetch leaves:', err);
        setError('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLeaves();
    }
  }, [user?.id, BASE_URL]);

  // Filtered leaves based on search
  const filteredLeaves = leaves.filter(leave =>
    leave.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLeaveClick = (leave) => {
    setSelectedLeave(leave)
  }

  const handleStatusChange = async (id, newStatus) => {
    if (!user || !user.id) {
      alert("You're not logged in or user ID is missing.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = newStatus === 'approved' ? 'approve' : 'reject';
      
      const res = await fetch(`${BASE_URL}/leave/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `${endpoint} failed`);

      setLeaves(prev =>
        prev.map(leave =>
          leave.id === id ? { ...leave, status: newStatus } : leave
        )
      );
      setSelectedLeave(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 sm:p-4">
      {/* Leave List Panel */}
      <div className={`${selectedLeave ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-light text-gray-800">Leave Requests</h2>
              <p className="text-sm text-gray-500">Manage employee leave applications</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link
                to="/dashboard/leaves/new"
                className="flex items-center px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap"
              >
                <FiPlus className="mr-1 h-4 w-4" />
                New Request
              </Link>
            </div>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map(leave => (
                <div
                  key={leave.id}
                  onClick={() => handleLeaveClick(leave)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedLeave?.id === leave.id ? 
                    'border-primary bg-blue-50' : 
                    'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="flex-shrink-0 h-4 w-4 text-gray-400" />
                        <h3 className="font-medium text-gray-900 truncate">{leave.type}</h3>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <FiUser className="mr-1 h-3 w-3" />
                        <span>{users[leave.user_id]?.name || `User ${leave.user_id}`}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {leave.startDate} - {leave.endDate} • {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiClock className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-500">No leave requests found</h3>
                <p className="mt-1 text-xs text-gray-400">
                  {searchTerm ? 'Try a different search term' : 'Create your first leave request'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Detail Panel */}
      {selectedLeave && (
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedLeave.type}</h2>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <FiUser className="mr-1 h-4 w-4" />
                  <span>{users[selectedLeave.user_id]?.name || `User ${selectedLeave.user_id}`}</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <FiCalendar className="mr-1 h-4 w-4" />
                  <span>
                    {selectedLeave.startDate} to {selectedLeave.endDate} • {selectedLeave.total_days} day{selectedLeave.total_days !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close details"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Reason</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedLeave.reason}</p>
              </div>
            </div>

            {/* Approval Status */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">Approval Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Line Manager', approve: 'approved_by_manager', reject: 'rejected_by_manager' },
                  { label: 'Executive', approve: 'approved_by_executive', reject: 'rejected_by_executive' },
                  { label: 'HR', approve: 'approved_by_hr', reject: 'rejected_by_hr' },
                  { label: 'GMD', approve: 'approved_by_gmd', reject: 'rejected_by_gmd' },
                  { label: 'Chairman', approve: 'approved_by_chairman', reject: 'rejected_by_chairman' }
                ].map((approver) => {
                  const approved = selectedLeave[approver.approve] === 1;
                  const rejected = selectedLeave[approver.reject] === 1;
                  const status = approved ? 'approved' : rejected ? 'rejected' : 'pending';

                  return (
                    <div
                      key={approver.label}
                      className={`p-3 rounded-lg text-center ${
                        approved ? 'bg-green-50 text-green-700' :
                        rejected ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">{approver.label}</div>
                      <div className="flex items-center justify-center text-sm">
                        {status === 'approved' && <FiCheck className="mr-1 h-4 w-4" />}
                        <span className="capitalize">{status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedLeave.status === 'pending' && (
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'rejected')}
                  className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'approved')}
                  className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <FiCheck className="mr-2 h-4 w-4" />
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveList