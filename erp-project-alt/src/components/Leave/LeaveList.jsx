import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext';

const LeaveList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([])
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/leave`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json()
        setLeaves(data)
      } catch (err) {
        setError('Failed to load leave requests')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaves()
  }, [])

  const filteredLeaves = leaves.filter(leave =>
    leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      if (newStatus === 'approved') {
        const res = await fetch(`${BASE_URL}/leave/${id}/approve`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: user.id })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Approval failed');

        setLeaves(prev =>
          prev.map(leave =>
            leave.id === id ? { ...leave, status: 'approved' } : leave
          )
        );
        setSelectedLeave(null);
      } else if (newStatus === 'rejected') {
        const res = await fetch(`${BASE_URL}/leave/${id}/reject`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: user.id })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Rejection failed');

        setLeaves(prev =>
          prev.map(leave =>
            leave.id === id ? { ...leave, status: 'rejected' } : leave
          )
        );
        setSelectedLeave(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">Loading leave requests...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-2 sm:p-4">
      {/* Leave List Panel */}
      <div className={`${selectedLeave ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">Leave Requests</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search requests..."
                className="flex-grow sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Link
                to="/dashboard/leaves/new"
                className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark whitespace-nowrap"
              >
                New Request
              </Link>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map(leave => (
                <div
                  key={leave.id}
                  onClick={() => handleLeaveClick(leave)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedLeave?.id === leave.id ? 'bg-gray-100 border-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{leave.type}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {leave.startDate} to {leave.endDate} ({leave.days} days)
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{leave.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No leave requests found</p>
            )}
          </div>
        </div>
      </div>

      {/* Leave Detail Panel */}
      {selectedLeave && (
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">{selectedLeave.type}</h2>
                <p className="text-sm text-gray-500">
                  {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.days} days)
                </p>
                <p className="text-xs text-gray-400">Status: {selectedLeave.status}</p>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
                aria-label="Close details"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-md sm:text-lg font-medium mb-2">Reason</h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                <p className="text-sm sm:text-base">{selectedLeave.reason}</p>
              </div>
            </div>

            {/* Approval Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              {[
                { label: 'Manager', approve: 'approved_by_manager', reject: 'rejected_by_manager' },
                { label: 'Executive', approve: 'approved_by_executive', reject: 'rejected_by_executive' },
                { label: 'HR', approve: 'approved_by_hr', reject: 'rejected_by_hr' },
                { label: 'GMD', approve: 'approved_by_gmd', reject: 'rejected_by_gmd' },
              ].map((approver) => {
                const approved = selectedLeave[approver.approve] === 1;
                const rejected = selectedLeave[approver.reject] === 1;
                const pending = !approved && !rejected;

                return (
                  <div 
                    key={approver.label} 
                    className={`p-2 rounded text-center text-xs sm:text-sm ${
                      approved ? 'bg-green-100 text-green-800' :
                      rejected ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="font-medium">{approver.label}</div>
                    <div>
                      {approved ? 'Approved' : rejected ? 'Rejected' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            {selectedLeave.status === 'pending' && (
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'rejected')}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'approved')}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Approve
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