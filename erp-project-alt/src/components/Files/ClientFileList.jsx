import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FiFile, FiImage, FiDownload, FiTrash2, FiUpload, 
  FiSearch, FiFilter, FiCheck, FiX, FiAlertCircle,
  FiCheckCircle, FiChevronLeft, FiFileText, FiFilePlus,
  FiFileMinus, 
} from 'react-icons/fi';
import { MdDescription as FileTypeIcon } from 'react-icons/md';




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
      const isViewable = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'text/plain'
      ].includes(fileType);

      if (isViewable) {
        window.open(`${BASE_URL}/files/view/${fileId}`, '_blank');
      } else {
        handleDownload(fileId, fileName);
      }
    } catch (err) {
      console.error('View failed:', err);
      setError(err.response?.data?.message || 'Failed to view file');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
      <div className="flex">
        <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );

  if (!client) return (
    <div className="text-center py-8">
      <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Client not found</h3>
      <p className="mt-1 text-sm text-gray-500">The requested client does not exist</p>
      <button
        onClick={() => navigate('/dashboard/files')}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <FiChevronLeft className="mr-2" /> Back to Files
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Client ID: {client.code}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="requisition">Requisitions</option>
                <option value="memo">Memos</option>
                <option value="contract">Contracts</option>
                <option value="report">Reports</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search files..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : 'Select all'}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {selectedFiles.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                isDeleting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <FiTrash2 className="mr-2" />
              {isDeleting ? 'Deleting...' : `Delete Selected`}
            </button>
          )}
          
          <Link
            to={`/dashboard/files/${clientId}/upload`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FiUpload className="mr-2" />
            Upload File
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
          <div className="flex">
            <FiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        {filteredFiles.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredFiles.map(file => (
              <div key={file.id} className={`p-4 hover:bg-gray-50 transition-colors ${
                selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                  
                  <div 
                    className="flex-shrink-0 h-10 w-10 cursor-pointer text-primary"
                    onClick={() => handleView(file.id, file.name, file.type)}
                    title={`Click to ${[
                      'image/jpeg',
                      'image/png',
                      'image/gif',
                      'application/pdf',
                      'text/plain'
                    ].includes(file.type) ? 'view' : 'download'} ${file.name}`}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          onClick={() => handleDownload(file.id, file.name)}
                          className="text-gray-400 hover:text-primary p-1"
                          title="Download"
                        >
                          <FiDownload className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-gray-400 hover:text-red-500 p-1 ml-2"
                          title="Delete"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{file.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.category === 'requisition' ? 'bg-green-100 text-green-800' :
                        file.category === 'memo' ? 'bg-blue-100 text-blue-800' :
                        file.category === 'contract' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {file.category}
                      </span>
                      <span className="inline-flex items-center text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="inline-flex items-center text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFile className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Get started by uploading a file'}
            </p>
            <div className="mt-6">
              <Link
                to={`/dashboard/files/${clientId}/upload`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <FiUpload className="mr-2" />
                Upload File
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getFileIcon(fileType) {
  const type = fileType?.split('/')[0];
  const subtype = fileType?.split('/')[1];
  
  if (fileType === 'application/pdf') {
    return <FileTypeIcon className="h-full w-full text-red-500" />;
  }
  
  if (type === 'image') {
    return <FiImage className="h-full w-full text-blue-500" />;
  }
  
  if (fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <FiFileText className="h-full w-full text-blue-600" />;
  }
  
  if (fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return <FiFilePlus className="h-full w-full text-green-600" />;
  }
  
  if (type === 'text') {
    return <FiFileText className="h-full w-full text-gray-600" />;
  }
  
  return <FiFile className="h-full w-full text-gray-400" />;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
}

export default ClientFileList;