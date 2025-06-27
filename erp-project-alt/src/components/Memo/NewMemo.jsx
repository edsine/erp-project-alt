import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const NewMemo = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  
  const navigate = useNavigate()
  const { user } = useAuth()
  const [memoType, setMemoType] = useState('normal') // 'normal' or 'report'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    // Report-specific fields
    reportType: '',
    reportDate: '',
    attachments: '',
    acknowledgments: []
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
      reportType: '',
      reportDate: '',
      attachments: '',
      acknowledgments: []
    })
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        memo_type: memoType,
        requires_approval: memoType === 'normal' // Only normal memos require approval
      }

      // Add report-specific data if it's a report memo
      if (memoType === 'report') {
        submitData.report_data = {
          reportType: formData.reportType,
          reportDate: formData.reportDate,
          attachments: formData.attachments,
          acknowledgments: formData.acknowledgments
        }
      }

      const response = await axios.post(`${BASE_URL}/memos`, submitData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (response.status === 201) {
        navigate('/dashboard/memos')
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
            Normal Memo (Requires Approval)
          </button>
          <button
            type="button"
            onClick={() => handleMemoTypeChange('report')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              memoType === 'report'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Report Memo (Acknowledgment Only)
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

        {/* Report-specific Fields */}
        {memoType === 'report' && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="reportType"
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Select report type</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="quarterly">Quarterly Report</option>
                  <option value="annual">Annual Report</option>
                  <option value="project">Project Report</option>
                  <option value="financial">Financial Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="reportDate"
                  name="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <input
                type="text"
                id="attachments"
                name="attachments"
                value={formData.attachments}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="List any attachments (comma separated)"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Acknowledgment From
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acknowledge_manager"
                    name="acknowledgments"
                    value="manager"
                    checked={formData.acknowledgments.includes('manager')}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        acknowledgments: checked
                          ? [...prev.acknowledgments, value]
                          : prev.acknowledgments.filter(v => v !== value)
                      }));
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="acknowledge_manager" className="ml-2 block text-sm text-gray-700">
                    Manager
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acknowledge_executive"
                    name="acknowledgments"
                    value="executive"
                    checked={formData.acknowledgments.includes('executive')}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        acknowledgments: checked
                          ? [...prev.acknowledgments, value]
                          : prev.acknowledgments.filter(v => v !== value)
                      }));
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="acknowledge_executive" className="ml-2 block text-sm text-gray-700">
                    Executive
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="acknowledge_finance"
                    name="acknowledgments"
                    value="finance"
                    checked={formData.acknowledgments.includes('finance')}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        acknowledgments: checked
                          ? [...prev.acknowledgments, value]
                          : prev.acknowledgments.filter(v => v !== value)
                      }));
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="acknowledge_finance" className="ml-2 block text-sm text-gray-700">
                    Finance
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard/memos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : `Send ${memoType === 'report' ? 'Report ' : ''}Memo`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewMemo