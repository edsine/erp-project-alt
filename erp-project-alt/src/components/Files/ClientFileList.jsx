import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ClientFileList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please login again.');
          navigate('/login');
          return;
        }

        const [clientRes, filesRes] = await Promise.all([
          axios.get(`${BASE_URL}/files/clients/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/files?client_id=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setClient(clientRes.data.data);
        setFiles(filesRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, navigate]);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' || file.category === filter;

    return matchesSearch && matchesFilter;
  });

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login again.');
      navigate('/login');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${BASE_URL}/files/delete-multiple`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { fileIds: selectedFiles }
        }
      );

      if (response.data.success) {
        setFiles(files.filter(file => !selectedFiles.includes(file.id)));
        setSelectedFiles([]);
        setSelectAll(false);
        setSuccess(`${selectedFiles.length} file(s) deleted successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to delete files');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete files');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (fileId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login again.');
      navigate('/login');
      return;
    }

    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await axios.delete(`${BASE_URL}/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFiles(files.filter(file => file.id !== fileId));
        setSuccess('File deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  const handleDownload = async (fileId, fileName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to download files');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/files/download/${fileId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let finalFileName = fileName;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?(;|$)/i);
        if (match) finalFileName = match[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = finalFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

    } catch (err) {
      console.error('Download error:', err);
      alert(`Download failed: ${err.message || 'Please try again'}`);
    }
  };

  const handleView = async (fileId, fileName, fileType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/files/view/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const isViewable = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
      ].includes(fileType);

      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);

      if (isViewable) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'download');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('View failed:', err);
      setError(err.response?.data?.message || 'Failed to view file');
    }
  };

  if (loading) return <div className="text-center py-8">Loading files...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!client) return <div className="text-center py-8">Client not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">{client.name}</h2>
          <p className="text-sm sm:text-base text-gray-500">{client.code}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm sm:text-base"
          >
            <option value="all">All Categories</option>
            <option value="requisition">Requisitions</option>
            <option value="memo">Memos</option>
            <option value="contract">Contracts</option>
            <option value="report">Reports</option>
            <option value="other">Other</option>
          </select>
          
          <input
            type="text"
            placeholder="Search files..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {selectedFiles.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className={`px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:text-base ${
                isDeleting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isDeleting ? 'Deleting...' : `Delete (${selectedFiles.length})`}
            </button>
          )}
          
          <Link
            to={`/dashboard/files/${clientId}/upload`}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm sm:text-base text-center"
          >
            Upload File
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4">
          <div className="flex items-start">
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

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {/* Desktop Table */}
        <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFiles.length > 0 ? (
              filteredFiles.map(file => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 h-10 w-10 cursor-pointer"
                        onClick={() => handleView(file.id, file.name, file.type)}
                        title="View file"
                      >
                        {getFileIcon(file.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-500">{file.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      file.category === 'requisition' ? 'bg-green-100 text-green-800' :
                      file.category === 'memo' ? 'bg-blue-100 text-blue-800' :
                      file.category === 'contract' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(file.id, file.name, file.type)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownload(file.id, file.name)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No files found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile List */}
        <div className="sm:hidden space-y-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map(file => (
              <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div 
                      className="flex-shrink-0 h-8 w-8 cursor-pointer"
                      onClick={() => handleView(file.id, file.name, file.type)}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(file.id, file.name, file.type)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDownload(file.id, file.name)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Download"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pl-11">
                  {file.description && (
                    <div className="text-sm text-gray-500 mb-2">{file.description}</div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      file.category === 'requisition' ? 'bg-green-100 text-green-800' :
                      file.category === 'memo' ? 'bg-blue-100 text-blue-800' :
                      file.category === 'contract' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-xs text-red-600 hover:text-red-900 flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getFileIcon(fileType) {
  const type = fileType?.split('/')[0];
  const subtype = fileType?.split('/')[1];
  
  if (fileType === 'application/pdf') {
    return (
      <svg className="h-full w-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  if (type === 'image') {
    return (
      <svg className="h-full w-full text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return (
      <svg className="h-full w-full text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  if (fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return (
      <svg className="h-full w-full text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  if (type === 'text') {
    return (
      <svg className="h-full w-full text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  return (
    <svg className="h-full w-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
}

export default ClientFileList;