import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiFileText, FiCheck, FiX, FiCalendar, FiPlus, FiChevronDown, FiArrowLeft } from 'react-icons/fi';

const NewMemo = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [memoType, setMemoType] = useState('normal');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    reportType: '',
    reportDate: '',
    acknowledgments: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMemoTypeChange = (type) => {
    setMemoType(type);
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      reportType: '',
      reportDate: '',
      acknowledgments: []
    });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        created_by: user.id,
        department: user.department,
        memo_type: memoType,
        requires_approval: memoType === 'normal'
      };

      if (memoType === 'report') {
        submitData.report_data = {
          reportType: formData.reportType,
          reportDate: formData.reportDate,
          acknowledgments: formData.acknowledgments
        };
      }

      const response = await axios.post(`${BASE_URL}/memos`, submitData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.status === 201) {
        navigate('/dashboard/memos');
      }
    } catch (err) {
      console.error('Error creating memo:', err);
      setError(err.response?.data?.message || 'Failed to create memo');
    } finally {
      setLoading(false);
    }
  };

  const toggleAcknowledgment = (value) => {
    setFormData(prev => ({
      ...prev,
      acknowledgments: prev.acknowledgments.includes(value)
        ? prev.acknowledgments.filter(v => v !== value)
        : [...prev.acknowledgments, value]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/memos')}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Memos
          </button>
          <h2 className="text-xl font-semibold text-white">Create New Memo</h2>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Memo Type Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Memo Type</h3>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
              <button
                type="button"
                onClick={() => handleMemoTypeChange('normal')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  memoType === 'normal' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Approval Memo
              </button>
              <button
                type="button"
                onClick={() => handleMemoTypeChange('report')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  memoType === 'report' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Report Memo
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows="6"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Enter memo content..."
                required
              />
            </div>
          </div>

          {/* Report-specific Fields */}
          {memoType === 'report' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reportType"
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Request Acknowledgment From</h4>
                <div className="space-y-3">
                  {['manager', 'executive', 'finance'].map((role) => (
                    <div key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`acknowledge_${role}`}
                        checked={formData.acknowledgments.includes(role)}
                        onChange={() => toggleAcknowledgment(role)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`acknowledge_${role}`} className="ml-3 block text-sm text-gray-700">
                        {role === 'executive' ? 'GMD' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/memos')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Send ${memoType === 'report' ? 'Report ' : ''}Memo`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMemo;