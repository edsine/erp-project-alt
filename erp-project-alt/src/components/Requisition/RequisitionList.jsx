import { useState } from 'react'
import { Link } from 'react-router-dom'

const RequisitionList = () => {
  const [requisitions, setRequisitions] = useState([
    {
      id: 1,
      title: 'Office Supplies Request',
      department: 'Operations',
      date: '2023-06-15',
      status: 'pending',
      amount: 1250.00,
    },
    {
      id: 2,
      title: 'Software License Renewal',
      department: 'IT',
      date: '2023-06-10',
      status: 'approved',
      amount: 3200.00,
    },
    {
      id: 3,
      title: 'Team Building Event',
      department: 'HR',
      date: '2023-06-05',
      status: 'rejected',
      amount: 5000.00,
    },
  ])

  const [selectedRequisition, setSelectedRequisition] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRequisitions = requisitions.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <p className="text-sm text-gray-500">{req.department}</p>
                  <p className="text-sm font-medium">${req.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{req.date}</p>
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
                <p className="text-sm text-gray-500">Department: {selectedRequisition.department}</p>
                <p className="text-xs text-gray-400">Date: {selectedRequisition.date}</p>
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
                <p>Request for purchase of office supplies including stationery, printer ink, and other necessary items for daily operations.</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Items Requested:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Printer Ink Cartridges (x10)</li>
                    <li>A4 Paper (10 reams)</li>
                    <li>Staplers (x5)</li>
                    <li>Notepads (x20)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested Amount</h4>
                <p className="text-lg font-semibold">${selectedRequisition.amount.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="text-lg font-semibold capitalize">{selectedRequisition.status}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              <div className="flex items-center space-x-2">
                <div className="flex items-center p-2 border rounded-md">
                  <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">quote.pdf</span>
                </div>
              </div>
            </div>

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