import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequisitionDetails = ({ requisition }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:7000';

  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const parseItems = (items) => {
  // If items is already an array (new format), return it
  if (Array.isArray(items)) return items;
  
  // If it's a stringified array, parse it
  if (typeof items === 'string' && items.startsWith('[')) {
    try {
      return JSON.parse(items);
    } catch (e) {
      console.error('Failed to parse items JSON', e);
    }
  }
  

  return items.split('\n').filter(Boolean).map(item => {
    // Handle the format: "Item Name (Qty: 1, Price: 100)"
    const match = item.match(/(.*?)\s*\(?Qty:\s*(\d+).*?Price:\s*([\d.]+)\)?/i);
    if (match) {
      return {
        name: match[1].trim(),
        quantity: parseInt(match[2]),
        unitPrice: parseFloat(match[3])
      };
    }
    
    // Fallback for malformed items
    return {
      name: item.trim(),
      quantity: 1,
      unitPrice: 0
    };
  });
};




  const items = parseItems(requisition.items);
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/requisitions/${requisition.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Approval failed');
      }

      navigate('/dashboard/requisitions', { state: { refresh: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/requisitions/${requisition.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Rejection failed');
      }

      navigate('/dashboard/requisitions', { state: { refresh: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to list
      </button>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{requisition.title}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span>Created: {formatDate(requisition.created_at)}</span>
              <span className="mx-2">•</span>
              <span>Status: <span className={`font-semibold ${requisition.status === 'approved' ? 'text-green-600' : requisition.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                {requisition.status.charAt(0).toUpperCase() + requisition.status.slice(1)}
              </span></span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Details</h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-line">{requisition.description}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Items Requested</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ITEM</th>
      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">QUANTITY</th>
      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">UNIT PRICE</th>
      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TOTAL</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {items.map((item, index) => (
      <tr key={index}>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₦{item.unitPrice.toFixed(2)}</td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
          ₦{(item.quantity * item.unitPrice).toFixed(2)}
        </td>
      </tr>
    ))}
  </tbody>
  <tfoot className="bg-gray-50">
    <tr>
      <td colSpan="3" className="px-4 py-4 text-right text-sm font-medium text-gray-700">Grand Total</td>
      <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">
        ₦{items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
      </td>
    </tr>
  </tfoot>
</table>
          </div>
        </div>

        {requisition.attachment && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Attachment</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <a
                href={`${BASE_URL}/${requisition.attachment}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Attachment ({requisition.attachment_type})
              </a>
            </div>
          </div>
        )}

        {requisition.status === 'pending' && ['manager', 'executive', 'finance', 'gmd', 'chairman'].includes(user.role.toLowerCase()) && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleReject}
              disabled={loading}
              className={`bg-white hover:bg-gray-100 text-red-600 border border-red-600 font-bold py-2 px-4 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequisitionDetails;