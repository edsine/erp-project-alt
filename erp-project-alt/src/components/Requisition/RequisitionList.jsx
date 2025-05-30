import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../../context/AuthContext";

const RequisitionList = () => {
  const [requisitions, setRequisitions] = useState([])
  const { user } = useAuth()
  const [selectedRequisition, setSelectedRequisition] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const response = await fetch(`http://localhost:7000/api/requisitions/user/${user.id}`)
        const data = await response.json()
        
        if (response.ok) {
          setRequisitions(data.data)
        } else {
          throw new Error(data.message || 'Failed to fetch requisitions')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRequisitions()
  }, [user.id])

  const filteredRequisitions = requisitions.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRequisitionClick = (requisition) => {
    setSelectedRequisition(requisition)
  }

  const handleStatusChange = (id, newStatus) => {
    setRequisitions(requisitions.map(req =>
      req.id === id ? { ...req, status: newStatus } : req
    ))
    setSelectedRequisition(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) return <div className="text-center py-8">Loading requisitions...</div>
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>

const handleApprove = async (id) => {
  try {
    const response = await fetch(`http://localhost:7000/api/requisitions/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve requisition');
    }

    // Update the requisitions list with new status
    setRequisitions(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'approved' } : req
      )
    );

    setSelectedRequisition(null);
  } catch (error) {
    console.error('Approve error:', error);
    alert(error.message);
  }
};

const handleReject = async (id) => {
  try {
    const response = await fetch(`http://localhost:7000/api/requisitions/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject requisition');
    }

    setRequisitions(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' } : req
      )
    );

    setSelectedRequisition(null);
  } catch (error) {
    console.error('Reject error:', error);
    alert(error.message);
  }
};



  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className={`${selectedRequisition ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Requisitions</h2>
            <Link
              to="/requisitions/new"
              className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
            >
              New Requisition
            </Link>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search requisitions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredRequisitions.length > 0 ? (
              filteredRequisitions.map(req => (
                <div
                  key={req.id}
                  onClick={() => handleRequisitionClick(req)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedRequisition?.id === req.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{req.title}</h3>
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>
                  <p className="text-sm font-medium">₦{parseFloat(req.total).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No requisitions found</p>
            )}
          </div>
        </div>
      </div>

      {selectedRequisition && (
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedRequisition.title}</h2>
                <p className="text-sm text-gray-500">Created: {formatDate(selectedRequisition.created_at)}</p>
                <p className="text-xs text-gray-400">Last updated: {formatDate(selectedRequisition.updated_at)}</p>
              </div>
              <button
                onClick={() => setSelectedRequisition(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>{selectedRequisition.description}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Items Requested:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedRequisition.items.split(',').map((item, index) => (
                      <li key={index}>{item.trim()}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                <p className="text-lg font-semibold">{selectedRequisition.quantity}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Unit Price</h4>
                <p className="text-lg font-semibold">₦{parseFloat(selectedRequisition.unit_price).toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                <p className="text-lg font-semibold">₦{parseFloat(selectedRequisition.total).toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="text-lg font-semibold capitalize">{selectedRequisition.status}</p>
              </div>
            </div>

            {selectedRequisition.attachment && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Attachment</h4>
                <a 
                  href={`http://localhost:7000/${selectedRequisition.attachment}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-2 border rounded-md hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">View Attachment</span>
                </a>
              </div>
            )}

            {selectedRequisition.status === 'pending' && (
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => handleStatusChange(selectedRequisition.id, 'rejected')}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedRequisition.id, 'approved')}
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

export default RequisitionList