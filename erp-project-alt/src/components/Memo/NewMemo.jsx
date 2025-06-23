import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const NewMemo = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [memoType, setMemoType] = useState('normal') // 'normal' or 'requisition'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    // Requisition-specific fields
    requestedBy: '',
    department: '',
    requestedItems: '',
    quantity: '',
    estimatedCost: '',
    justification: '',
    approvalRequired: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMemoTypeChange = (type) => {
    setMemoType(type)
    // Reset form data when switching types
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      requestedBy: '',
      department: '',
      requestedItems: '',
      quantity: '',
      estimatedCost: '',
      justification: '',
      approvalRequired: false
    })
    setError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        created_by: user.id,
        memo_type: memoType
      }

      // Add requisition-specific data if it's a requisition memo
      if (memoType === 'requisition') {
        submitData.requisition_data = {
          requestedBy: formData.requestedBy,
          department: formData.department,
          requestedItems: formData.requestedItems,
          quantity: formData.quantity,
          estimatedCost: formData.estimatedCost,
          justification: formData.justification,
          approvalRequired: formData.approvalRequired
        }
      }

      const response = await axios.post('http://localhost:7000/api/memos', submitData)

      if (response.status === 201) {
        navigate('/memos')
      }
    } catch (err) {
      console.error('Error creating memo:', err)
      setError(err.response?.data?.message || 'Failed to create memo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Create New Memo</h2>
      
      {/* Memo Type Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Memo Type</label>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleMemoTypeChange('normal')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              memoType === 'normal'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Normal Memo
          </button>
          <button
            type="button"
            onClick={() => handleMemoTypeChange('requisition')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              memoType === 'requisition'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Memo with Requisition
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Common Fields */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            rows="5"
            value={formData.content}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Requisition-specific Fields */}
        {memoType === 'requisition' && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requisition Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="requestedBy"
                  name="requestedBy"
                  value={formData.requestedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="requestedItems" className="block text-sm font-medium text-gray-700 mb-1">
                Requested Items/Services <span className="text-red-500">*</span>
              </label>
              <textarea
                id="requestedItems"
                name="requestedItems"
                rows="3"
                value={formData.requestedItems}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe the items or services being requested..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 10 units, 5 hours, etc."
                />
              </div>

              <div>
                <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost
                </label>
                <input
                  type="text"
                  id="estimatedCost"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="$0.00"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                id="justification"
                name="justification"
                rows="3"
                value={formData.justification}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Explain why this requisition is necessary..."
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approvalRequired"
                  name="approvalRequired"
                  checked={formData.approvalRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="approvalRequired" className="ml-2 block text-sm text-gray-700">
                  Manager approval required
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/memos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : `Send ${memoType === 'requisition' ? 'Requisition ' : ''}Memo`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewMemo