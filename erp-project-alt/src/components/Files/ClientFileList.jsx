// ClientFileList.jsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FolderOpen, Download, Trash2, Eye, Search, Filter, 
  ChevronDown, Loader2, CheckSquare, Square, FileText,
  File, Image, FileSpreadsheet, FileCode, X
} from 'lucide-react';
import { useMemo } from 'react';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  
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

const filteredFiles = useMemo(() => {
  return files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || file.category === filter;
    return matchesSearch && matchesFilter;
  });
}, [files, searchTerm, filter]);

  // Reset selectAll when filtered files change
  useEffect(() => {
    setSelectAll(false);
    setSelectedFiles([]);
  }, [filteredFiles]);

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

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

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
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.split('/')[0];
    if (fileType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (type === 'image') return <Image className="w-8 h-8 text-blue-500" />;
    if (fileType?.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) 
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    if (type === 'text') return <FileCode className="w-8 h-8 text-gray-600" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'requisition': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'memo': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'contract': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'report': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
        {error}
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-center">
        Client not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{client.code}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/dashboard/files/${clientId}/upload`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-sm text-sm font-medium"
            >
              <FolderOpen className="w-4 h-4" />
              Upload File
            </Link>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="requisition">Requisitions</option>
                <option value="memo">Memos</option>
                <option value="contract">Contracts</option>
                <option value="report">Reports</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Bulk selection */}
            {filteredFiles.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition"
              >
                {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {selectAll ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          {/* Bulk delete button */}
          {selectedFiles.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-sm text-sm font-medium disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Success / Error messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* File Listing - Grid or List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No files found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md group ${
                selectedFiles.includes(file.id) ? 'ring-2 ring-primary border-primary' : 'border-gray-100'
              }`}
            >
              {/* Selection checkbox (top right) */}
              <div className="relative">
                <button
                  onClick={() => toggleFileSelection(file.id)}
                  className="absolute top-3 right-3 z-10 p-1 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white transition"
                >
                  {selectedFiles.includes(file.id) ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {/* File Icon & Name */}
                <div className="p-5 pb-3 flex flex-col items-center text-center">
                  <div className="mb-3 mt-8">{getFileIcon(file.type)}</div>
                  <h3 className="font-medium text-gray-800 text-sm mt-9 -mb-5 line-clamp-2">{file.name}</h3>
                  {file.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{file.description}</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="px-4 pb-3 flex flex-wrap justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-3">
                <span className={`px-2 py-0.5 rounded-full border ${getCategoryColor(file.category)}`}>
                  {file.category}
                </span>
                <span>{formatFileSize(file.size)}</span>
              </div>
              <div className="px-4 pb-3 text-xs text-gray-400">
                Uploaded {new Date(file.created_at).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                <button
                  onClick={() => handleView(file.id, file.name, file.type)}
                  className="flex-1 py-2.5 text-gray-600 hover:text-primary flex items-center justify-center gap-1 text-sm transition"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleDownload(file.id, file.name)}
                  className="flex-1 py-2.5 text-gray-600 hover:text-primary flex items-center justify-center gap-1 text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="flex-1 py-2.5 text-gray-600 hover:text-red-600 flex items-center justify-center gap-1 text-sm transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List view (responsive table-like cards)
        <div className="space-y-3">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                selectedFiles.includes(file.id) ? 'ring-2 ring-primary border-primary' : 'border-gray-100'
              }`}
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Checkbox + Icon */}
                <div className="flex items-center gap-3 sm:w-1/3">
                  <button onClick={() => toggleFileSelection(file.id)} className="flex-shrink-0">
                    {selectedFiles.includes(file.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-800 text-sm truncate">{file.name}</div>
                    {file.description && (
                      <div className="text-xs text-gray-400 truncate">{file.description}</div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 sm:flex-1 sm:justify-between items-center text-sm">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${getCategoryColor(file.category)}`}>
                    {file.category}
                  </span>
                  <span className="text-gray-500 text-xs">{formatFileSize(file.size)}</span>
                  <span className="text-gray-400 text-xs">{new Date(file.created_at).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(file.id, file.name, file.type)}
                      className="p-1.5 text-gray-500 hover:text-primary transition rounded-md"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(file.id, file.name)}
                      className="p-1.5 text-gray-500 hover:text-primary transition rounded-md"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 transition rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFileList;