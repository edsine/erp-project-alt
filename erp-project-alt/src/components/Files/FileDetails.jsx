import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const FileDetails = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { clientId, fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please login again.');
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BASE_URL}/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFile(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch file details');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId, navigate]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please login again.');
          navigate('/login');
          return;
        }

        await axios.delete(`${BASE_URL}/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('File deleted successfully!');
        setTimeout(() => {
          navigate(`/dashboard/files/${clientId}`);
        }, 1500);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading file details...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!file) return <div className="text-center py-8">File not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-auto max-w-4xl">
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

      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">{file.name}</h2>
          <p className="text-sm sm:text-base text-gray-500">{file.description}</p>
        </div>
        <button
          onClick={() => navigate(`/dashboard/files/${clientId}`)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
            <h3 className="text-md sm:text-lg font-medium mb-2">File Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Category</p>
                <p className="text-sm sm:text-base font-medium capitalize">{file.category}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">File Type</p>
                <p className="text-sm sm:text-base font-medium">{file.type}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">File Size</p>
                <p className="text-sm sm:text-base font-medium">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Uploaded</p>
                <p className="text-sm sm:text-base font-medium">{new Date(file.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Uploaded By</p>
                <p className="text-sm sm:text-base font-medium">User {file.uploaded_by}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-3 sm:p-4 border border-gray-200 rounded-md">
          {file.type.startsWith('image/') ? (
            <img
              src={`${BASE_URL}/${file.path}`}
              alt={file.name}
              className="max-h-48 max-w-full rounded"
            />
          ) : (
            <div className="text-center">
              <svg className="h-12 sm:h-16 w-12 sm:w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-xs sm:text-sm text-gray-500">Preview not available</p>
            </div>
          )}
          <a
            href={`${BASE_URL}/${file.path}`}
            download
            className="mt-4 px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm sm:text-base"
          >
            Download File
          </a>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          onClick={handleDelete}
          className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors text-sm sm:text-base"
        >
          Delete File
        </button>
        <button
          onClick={() => navigate(`/dashboard/files/${clientId}/upload`)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm sm:text-base"
        >
          Upload New Version
        </button>
      </div>
    </div>
  );
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default FileDetails;