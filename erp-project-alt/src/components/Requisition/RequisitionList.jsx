import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { FiFileText, FiCheck, FiX, FiClock, FiChevronRight, FiPlus, FiSearch, FiPaperclip } from 'react-icons/fi';

const RequisitionList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchRequisitions = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const [reqResponse, usersResponse] = await Promise.all([
          fetch(`${BASE_URL}/requisitions/user/${user?.id}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        const result = await reqResponse.json();
        const usersData = await usersResponse.json();

        if (reqResponse.ok && result.success) {
          setRequisitions(result.data);
          
          const usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
          setUsers(usersMap);
        } else {
          throw new Error(result.message || 'Failed to fetch requisitions');
        }
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRequisitions();
    }
  }, [user?.id, BASE_URL]);

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (users[req.created_by]?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (activeTab) {
      case 'approved':
        return matchesSearch && req.status === 'approved';
      case 'rejected':
        return matchesSearch && req.status === 'rejected';
      case 'pending':
        return matchesSearch && req.status === 'pending';
      default:
        return matchesSearch;
    }
  });

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve requisition');
      }

      setRequisitions(prev =>
        prev.map(req => {
          if (req.id === id) {
            return {
              ...req,
              [result.field]: 'approved',
              status: 'approved'
            };
          }
          return req;
        })
      );

      if (selectedRequisition?.id === id) {
        setSelectedRequisition(prev => ({
          ...prev,
          [result.field]: 'approved',
          status: 'approved'
        }));
      }
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
      default:
        return {
          className: `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`,
          text: 'Pending',
          icon: <FiClock className="h-3 w-3 mr-1" />
        };
    }
  };

  const isICTDepartment = (requisition) => {
    const creatorUser = users[requisition.created_by];
    return creatorUser?.department?.toLowerCase() === 'ict';
  };

  const shouldShowApprovalSection = (requisition) => {
    if (requisition.status !== 'pending') return false;
    
    const isICT = isICTDepartment(requisition);
    
    if (isICT) {
      return (user.role === 'manager' && !requisition.approved_by_manager) ||
             (user.role === 'executive' && requisition.approved_by_manager && !requisition.approved_by_executive) ||
             (user.role === 'finance' && requisition.approved_by_executive && !requisition.approved_by_finance) ||
             (user.role === 'gmd' && requisition.approved_by_finance && !requisition.approved_by_gmd) ||
             (user.role === 'chairman' && requisition.approved_by_gmd && !requisition.approved_by_chairman);
    }
    
    return (user.role === 'finance' && !requisition.approved_by_finance) ||
           (user.role === 'gmd' && requisition.approved_by_finance && !requisition.approved_by_gmd) ||
           (user.role === 'chairman' && requisition.approved_by_gmd && !requisition.approved_by_chairman);
  };

  const isFullyApproved = (requisition) => {
    const isICT = isICTDepartment(requisition);
    
    if (isICT) {
      return requisition.approved_by_manager && requisition.approved_by_executive && 
             requisition.approved_by_finance && requisition.approved_by_gmd && 
             requisition.approved_by_chairman;
    }
    
    return requisition.approved_by_finance && requisition.approved_by_gmd && 
           requisition.approved_by_chairman;
  };

  const renderApprovalStatus = (requisition) => {
    const isICT = isICTDepartment(requisition);
    
    return (
      <div className={`grid gap-2 mb-6 border-t pt-4 ${isICT ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
        {isICT && (
          <>
            <div className={`p-2 rounded text-center text-xs ${
              requisition.approved_by_manager ? 'bg-green-100 text-green-800' :
              requisition.rejected_by_manager ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <div className="font-medium">Manager</div>
              <div>
                {requisition.approved_by_manager ? 'Approved' : 
                 requisition.rejected_by_manager ? 'Rejected' : 'Pending'}
              </div>
            </div>
            <div className={`p-2 rounded text-center text-xs ${
              requisition.approved_by_executive ? 'bg-green-100 text-green-800' :
              requisition.rejected_by_executive ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <div className="font-medium">Executive</div>
              <div>
                {requisition.approved_by_executive ? 'Approved' : 
                 requisition.rejected_by_executive ? 'Rejected' : 'Pending'}
              </div>
            </div>
          </>
        )}
        
        <div className={`p-2 rounded text-center text-xs ${
          requisition.approved_by_finance ? 'bg-green-100 text-green-800' :
          requisition.rejected_by_finance ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          <div className="font-medium">Finance</div>
          <div>
            {requisition.approved_by_finance ? 'Approved' : 
             requisition.rejected_by_finance ? 'Rejected' : 'Pending'}
          </div>
        </div>
        
        <div className={`p-2 rounded text-center text-xs ${
          requisition.approved_by_gmd ? 'bg-green-100 text-green-800' :
          requisition.rejected_by_gmd ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          <div className="font-medium">GMD</div>
          <div>
            {requisition.approved_by_gmd ? 'Approved' : 
             requisition.rejected_by_gmd ? 'Rejected' : 'Pending'}
          </div>
        </div>
        
        <div className={`p-2 rounded text-center text-xs ${
          requisition.approved_by_chairman ? 'bg-green-100 text-green-800' :
          requisition.rejected_by_chairman ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          <div className="font-medium">Chairman</div>
          <div>
            {requisition.approved_by_chairman ? 'Approved' : 
             requisition.rejected_by_chairman ? 'Rejected' : 'Pending'}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse text-gray-500">Loading requisitions...</div>
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
      {/* Requisitions List Panel */}
      <div className={`${selectedRequisition ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Requisitions</h2>
            <Link
              to="/dashboard/requisitions/new"
              className="flex items-center px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors"
            >
              <FiPlus className="h-4 w-4 mr-1" />
              New Requisition
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'approved' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'rejected' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rejected
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search requisitions..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredRequisitions.length > 0 ? (
              filteredRequisitions.map(req => (
                <div
                  key={req.id}
                  onClick={() => handleRequisitionClick(req)}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedRequisition?.id === req.id ? 'bg-gray-50 border-primary' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-800 truncate">{req.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">{req.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={getStatusBadge(req.status).className}>
                          {getStatusBadge(req.status).icon}
                          {getStatusBadge(req.status).text}
                        </span>
                        <span className="text-sm font-medium text-primary">₦{parseFloat(req.total).toFixed(2)}</span>
                      </div>
                    </div>
                    <FiChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(req.created_at)} • {users[req.created_by]?.name || `User ${req.created_by}`}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiFileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>No requisitions found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requisition Detail Panel */}
      {selectedRequisition && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedRequisition.title}</h2>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={getStatusBadge(selectedRequisition.status).className}>
                    {getStatusBadge(selectedRequisition.status).icon}
                    {getStatusBadge(selectedRequisition.status).text}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <p>Created: {formatDate(selectedRequisition.created_at)} by {users[selectedRequisition.created_by]?.name || `User ${selectedRequisition.created_by}`}</p>
                  <p>Last updated: {formatDate(selectedRequisition.updated_at)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequisition(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">{selectedRequisition.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Items Requested</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {selectedRequisition.items.split(',').map((item, index) => (
                    <li key={index}>{item.trim()}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRequisition.quantity}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Unit Price</h4>
                <p className="text-lg font-semibold text-gray-900">₦{parseFloat(selectedRequisition.unit_price).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h4>
                <p className="text-lg font-semibold text-primary">₦{parseFloat(selectedRequisition.total).toFixed(2)}</p>
              </div>
            </div>

            {selectedRequisition.attachment && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Supporting Document</h4>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <FiPaperclip className="h-5 w-5 text-gray-500 mr-3" />
                  <a
                    href={`${BASE_URL}/${selectedRequisition.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark underline"
                  >
                    View Attachment ({selectedRequisition.attachment_type})
                  </a>
                </div>
              </div>
            )}

            {renderApprovalStatus(selectedRequisition)}

            {shouldShowApprovalSection(selectedRequisition) && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
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