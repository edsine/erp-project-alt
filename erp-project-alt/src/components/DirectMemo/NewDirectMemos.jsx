import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SearchableDropdown = ({ 
  label, 
  users, 
  selectedUsers, 
  onSelectionChange, 
  excludeUsers = [], 
  required = false,
  placeholder = "Search and select users..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    !excludeUsers.includes(user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));

  const handleUserToggle = (userId) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    onSelectionChange(newSelection);
  };

  const removeUser = (userId) => {
    const newSelection = selectedUsers.filter(id => id !== userId);
    onSelectionChange(newSelection);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected Users Display */}
      {selectedUserObjects.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedUserObjects.map(user => (
            <span
              key={user.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {user.name} ({user.role})
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          required={required && selectedUsers.length === 0}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleUserToggle(user.id)}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  selectedUsers.includes(user.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 mr-3 border rounded ${
                    selectedUsers.includes(user.id) 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {selectedUsers.includes(user.id) && (
                      <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.department} - {user.role}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500">No users found</div>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

const NewDirectMemos = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if we're coming from a task request/submission
  const taskInfo = location.state || {};
  const isTaskReport = taskInfo.taskId !== undefined;
  
  const [formData, setFormData] = useState({
    title: taskInfo.taskTitle ? `Task Report: ${taskInfo.taskTitle}` : '',
    content: taskInfo.taskTitle ? `This is a task report for: ${taskInfo.taskTitle}\n\n` : '',
    recipients: taskInfo.recipientId ? [taskInfo.recipientId] : [],
    cc: [],
    priority: 'medium',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [filteredCC, setFilteredCC] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        
        const usersData = response.data;
        setAllUsers(usersData);
        
        // Filter users for recipients based on sender's role
        const recipientsFiltered = usersData.filter(u => {
          // Always exclude current user
          if (u.id === user.id) return false;
          
          // If sender is executive, gmd, or finance, show all users
          if (['executive', 'gmd', 'finance'].includes(user.role?.toLowerCase())) {
            return true;
          }
          
          // For other roles, exclude chairman from recipients
          return u.role?.toLowerCase() !== 'chairman';
        });
        
        // For CC, all users except current user can be shown
        const ccFiltered = usersData.filter(u => u.id !== user.id);
        
        setFilteredRecipients(recipientsFiltered);
        setFilteredCC(ccFiltered);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [BASE_URL, user.token, user.id, user.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecipientsChange = (selectedRecipients) => {
    setFormData(prev => ({
      ...prev,
      recipients: selectedRecipients
    }));
  };

  const handleCCChange = (selectedCC) => {
    setFormData(prev => ({
      ...prev,
      cc: selectedCC
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (500MB per file limit)
    const maxSize = 500 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 500MB per file.`);
      return;
    }
    
    // Validate file types
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
    ];
    
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported file types: ${invalidFiles.map(f => f.name).join(', ')}. Supported types: PDF, Word, Excel, Text, Images.`);
      return;
    }
    
    setError('');
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.recipients.length === 0) {
      setError('Please select at least one recipient');
      setLoading(false);
      return;
    }

    try {
      const submitFormData = new FormData();
      
      // Add basic memo data
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('priority', formData.priority);
      submitFormData.append('created_by', user.id);
      submitFormData.append('recipients', JSON.stringify(formData.recipients));
      submitFormData.append('cc', JSON.stringify(formData.cc));
      
      // Add task reference if this is a task report
      if (taskInfo.taskId) {
        submitFormData.append('task_id', taskInfo.taskId);
      }

      // Add files
      selectedFiles.forEach((file) => {
        submitFormData.append('files', file);
      });

      const response = await axios.post(`${BASE_URL}/direct-memos`, submitFormData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        navigate('/dashboard/direct-memos');
      }
    } catch (err) {
      console.error('Error creating task report:', err);
      setError(err.response?.data?.message || 'Failed to create memo');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    const fileType = file.type?.split('/')[0] || '';
    const extension = file.name?.split('.').pop()?.toLowerCase() || '';

    const iconClass = "h-8 w-8 text-gray-400";

    if (file.type === 'application/pdf' || extension === 'pdf') {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }

    if (file.type.includes('word') || ['doc', 'docx'].includes(extension)) {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }

    if (file.type.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }

    if (fileType === 'image') {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (isLoadingUsers) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          {isTaskReport ? 'Submit Task Report' : 'Send Task Report'}
        </h2>
        {isTaskReport && taskInfo.taskTitle && (
          <p className="text-sm text-gray-600 mt-1">
            For task: <span className="font-medium">{taskInfo.taskTitle}</span>
          </p>
        )}
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
          <SearchableDropdown
            label="Recipients"
            users={filteredRecipients}
            selectedUsers={formData.recipients}
            onSelectionChange={handleRecipientsChange}
            required={true}
            placeholder="Search and select recipients..."
          />
          {!['executive', 'gmd', 'finance'].includes(user.role?.toLowerCase()) && (
            <p className="mt-1 text-xs text-gray-500">
              Note: All Weekly Task reports must be submitted before 12 pm on Monday.
            </p>
          )}
        </div>

        <div className="mb-4">
          <SearchableDropdown
            label="CC (Optional)"
            users={filteredCC}
            selectedUsers={formData.cc}
            onSelectionChange={handleCCChange}
            excludeUsers={formData.recipients}
            placeholder="Search and select CC recipients..."
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          
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

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard/direct-memos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : 'Send Task Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDirectMemos;