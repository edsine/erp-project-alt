import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'


// File icon helper function
const getFileIcon = (file) => {
  const fileType = file.type?.split('/')[0] || '';
  const extension = file.name?.split('.').pop()?.toLowerCase() || '';

  const iconClass = "h-8 w-8 text-gray-400";

  // PDF
  if (file.type === 'application/pdf' || extension === 'pdf') {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Word
  if (file.type.includes('word') || ['doc', 'docx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Excel
  if (file.type.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Image
  if (fileType === 'image') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};
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
  const [selectedFiles, setSelectedFiles] = useState([])
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
    setSelectedFiles([])
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file size (500MB per file limit)
    const maxSize = 500 * 1024 * 1024 // 500MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 500MB per file.`)
      return
    }
    
    // Validate file types (basic document types)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported file types: ${invalidFiles.map(f => f.name).join(', ')}. Supported types: PDF, Word, Excel, Text, Images.`)
      return
    }
    
    setError('')
    setSelectedFiles(prevFiles => [...prevFiles, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    const submitFormData = new FormData()
    
    // Add basic memo data (unchanged from original)
    submitFormData.append('title', formData.title)
    submitFormData.append('content', formData.content)
    submitFormData.append('priority', formData.priority)
    submitFormData.append('created_by', user.id)
    submitFormData.append('memo_type', memoType)
    submitFormData.append('requires_approval', memoType === 'normal')

    // Add report-specific data (unchanged from original)
    if (memoType === 'report') {
      const reportData = {
        reportType: formData.reportType,
        reportDate: formData.reportDate,
        attachments: formData.attachments,
        acknowledgments: formData.acknowledgments
      }
      submitFormData.append('report_data', JSON.stringify(reportData))
    }

    // Add files - ONLY CHANGE: using 'files' instead of 'files[]'
    selectedFiles.forEach((file) => {
      submitFormData.append('files', file)  // Changed from 'files[]' to 'files'
    })

    const response = await axios.post(`${BASE_URL}/memos`, submitFormData, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'multipart/form-data',
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
            Approval Memo 
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
            Report Memo 
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

        {/* File Upload Section */}
{/* File Upload Section */}
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Attachments (Optional)
  </label>
  
  {/* Drag and Drop Zone */}
  <div 
    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors hover:border-primary/50"
    onDragOver={(e) => {
      e.preventDefault();
      e.currentTarget.classList.add('border-primary', 'bg-blue-50');
    }}
    onDragLeave={(e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
    }}
    onDrop={(e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }}
  >
    <div className="space-y-1 text-center">
      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col items-center text-sm text-gray-600">
        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
          <span>Upload files</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          />
        </label>
        <p className="mt-1">or drag and drop</p>
      </div>
      <p className="text-xs text-gray-500">
        PDF, Word, Excel, Text, Images up to 500MB each
      </p>
    </div>
  </div>

  {/* Selected Files Display */}
  {selectedFiles.length > 0 && (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length})</h4>
      <div className="space-y-2">
        {selectedFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(file)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span className="mx-2">•</span>
                  <span>{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Remove file"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
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
                    Line Manager
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
                    GMD
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
                    Chairman
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