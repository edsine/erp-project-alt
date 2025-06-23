import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext';
const LeaveList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

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
        const res = await fetch('${BASE_URL}/leave')
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
    leave.reason.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (newStatus === 'approved') {
      const res = await fetch(`${BASE_URL}/leave/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      alert('Rejection not implemented yet.');
    }
  } catch (err) {
    alert(err.message);
  }
};


  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className={`${selectedLeave ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Leave Requests</h2>
            <Link
              to="/leaves/new"
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
            >
              New Request
            </Link>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search leave requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map(leave => (
                <div
                  key={leave.id}
                  onClick={() => handleLeaveClick(leave)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedLeave?.id === leave.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{leave.type}</h3>
                    {leave.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {leave.status === 'approved' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    )}
                    {leave.status === 'rejected' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {leave.startDate} to {leave.endDate} ({leave.days} days)
                  </p>
                  <p className="text-xs text-gray-400 truncate">{leave.reason}</p>

                  
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No leave requests found</p>
            )}
          </div>
        </div>
      </div>

      {selectedLeave && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedLeave.type}</h2>
                <p className="text-sm text-gray-500">
                  {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.days} days)
                </p>
                <p className="text-xs text-gray-400">Status: {selectedLeave.status}</p>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Reason</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>{selectedLeave.reason}</p>
              </div>
            {/* Enhanced Approval indicators */}
<div className="grid grid-cols-4 gap-2 mb-6 mt-4">
  {[
    { label: 'GMD 1', approve: 'approved_by_gmd', reject: 'rejected_by_gmd' },
    { label: 'Finance', approve: 'approved_by_finance', reject: 'rejected_by_finance' },
    { label: 'GMD 2', approve: 'approved_by_gmd2', reject: 'rejected_by_gmd2' },
    { label: 'Chairman', approve: 'approved_by_chairman', reject: 'rejected_by_chairman' },
  ].map((approver) => {
    const approved = selectedLeave[approver.approve] === 1;
    const rejected = selectedLeave[approver.reject] === 1;

    const bgColor = approved
      ? 'bg-green-100 text-green-800'
      : rejected
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-500';

    const statusText = approved
      ? 'Approved'
      : rejected
      ? 'Rejected'
      : 'Pending';

    return (
      <div key={approver.label} className={`p-2 rounded text-center text-xs ${bgColor}`}>
        {approver.label}: {statusText}
      </div>
    );
  })}
</div>


            </div>

            {selectedLeave.status === 'pending' && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'rejected')}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleStatusChange(selectedLeave.id, 'approved')}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary"
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