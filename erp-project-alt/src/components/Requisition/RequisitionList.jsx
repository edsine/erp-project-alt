import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const RequisitionList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/requisitions/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (response.ok) {
          setRequisitions(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch requisitions');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, [user.id]);

  const filteredRequisitions = requisitions.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequisitionClick = (requisition) => {
    setSelectedRequisition(requisition);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/requisitions/${id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve requisition');
      }

      setRequisitions(prev =>
        prev.map(req => {
          if (req.id === id) {
            const updated = { ...req };
            if (user.role.toLowerCase() === 'manager') updated.approved_by_manager = true;
            else if (user.role.toLowerCase() === 'executive') updated.approved_by_executive = true;
            else if (user.role.toLowerCase() === 'finance') updated.approved_by_finance = true;
            else if (user.role.toLowerCase() === 'gmd') updated.approved_by_gmd = true;
            else if (user.role.toLowerCase() === 'chairman') updated.approved_by_chairman = true;

            updated.status = 'approved';
            return updated;
          }
          return req;
        })
      );
      setSelectedRequisition(null);
    } catch (error) {
      console.error('Approve error:', error);
      alert(error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/requisitions/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject requisition');
      }

      setRequisitions(prev =>
        prev.map(req => {
          if (req.id === id) {
            const updated = { ...req };
            const role = user.role.toLowerCase();

            if (role === 'manager') updated.rejected_by_manager = true;
            else if (role === 'executive') updated.rejected_by_executive = true;
            else if (role === 'finance') updated.rejected_by_finance = true;
            else if (role === 'gmd') updated.rejected_by_gmd = true;
            else if (role === 'chairman') updated.rejected_by_chairman = true;

            updated.status = 'rejected';
            return updated;
          }
          return req;
        })
      );
      setSelectedRequisition(null);
    } catch (error) {
      console.error('Reject error:', error);
      alert(error.message);
    }
  };

  if (loading) return <div className="text-center py-8">Loading requisitions...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-2 sm:p-4">
      {/* Requisitions List Panel */}
      <div className={`${selectedRequisition ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">Requisitions</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search requisitions..."
                className="flex-grow sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Link
                to="/dashboard/requisitions/new"
                className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark whitespace-nowrap"
              >
                New Requisition
              </Link>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredRequisitions.length > 0 ? (
              filteredRequisitions.map(req => (
                <div
                  key={req.id}
                  onClick={() => handleRequisitionClick(req)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRequisition?.id === req.id ? 'bg-gray-100 border-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{req.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">{req.description}</p>
                      <p className="text-sm font-medium mt-1">₦{parseFloat(req.total).toFixed(2)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                        : req.status === 'approved' ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(req.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No requisitions found</p>
            )}
          </div>
        </div>
      </div>

      {/* Requisition Detail Panel */}
      {selectedRequisition && (
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">{selectedRequisition.title}</h2>
                <p className="text-sm text-gray-500">Created: {formatDate(selectedRequisition.created_at)}</p>
                <p className="text-xs text-gray-400">Last updated: {formatDate(selectedRequisition.updated_at)}</p>
              </div>
              <button
                onClick={() => setSelectedRequisition(null)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
                aria-label="Close details"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-md sm:text-lg font-medium mb-2">Details</h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                <p className="text-sm sm:text-base">{selectedRequisition.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Items Requested:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                    {selectedRequisition.items.split(',').map((item, index) => (
                      <li key={index}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                <p className="text-lg font-semibold">{selectedRequisition.quantity}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Unit Price</h4>
                <p className="text-lg font-semibold">₦{parseFloat(selectedRequisition.unit_price).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                <p className="text-lg font-semibold">₦{parseFloat(selectedRequisition.total).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Attachment</h4>
                {selectedRequisition.attachment ? (
                  <a
                    href={`${BASE_URL}/${selectedRequisition.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm sm:text-base"
                  >
                    View File ({selectedRequisition.attachment_type})
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No attachment</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Approvals</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Line Manager', 'executive', 'finance', 'gmd', 'chairman'].map(role => {
                  const approved = selectedRequisition[`approved_by_${role}`];
                  const rejected = selectedRequisition[`rejected_by_${role}`];

                  let statusLabel = 'Pending';
                  let statusClass = 'bg-gray-100 text-gray-600';

                  if (approved === 1 || approved === true) {
                    statusLabel = 'Approved';
                    statusClass = 'bg-green-100 text-green-800';
                  } else if (rejected === 1 || rejected === true) {
                    statusLabel = 'Rejected';
                    statusClass = 'bg-red-100 text-red-800';
                  }

                  return (
                    <div
                      key={role}
                      className={`p-2 rounded-md text-center ${statusClass}`}
                    >
                      <div className="text-xs font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                      <div className="text-xs">{statusLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRequisition.status === 'pending' && (
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => handleReject(selectedRequisition.id)}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedRequisition.id)}
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
  );
};

export default RequisitionList;