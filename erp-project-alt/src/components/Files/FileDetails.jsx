import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const FileDetails = () => {
  const { clientId, fileId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found - user needs to login again');
          return;
        }

        const response = await axios.get(`http://localhost:7000/api/files/${fileId}`, {
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
  }, [fileId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found - user needs to login again');
          return;
        }

        await axios.delete(`http://localhost:7000/api/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate(`/files/${clientId}`);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading file details...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!file) return <div className="text-center py-8">File not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold">{file.name}</h2>
          <p className="text-gray-500">{file.description}</p>
        </div>
        <button
          onClick={() => navigate(`/files/${clientId}`)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">File Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium capitalize">{file.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Type</p>
                <p className="font-medium">{file.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File Size</p>
                <p className="font-medium">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uploaded</p>
                <p className="font-medium">{new Date(file.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uploaded By</p>
                <p className="font-medium">User {file.uploaded_by}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-md">
          {file.type.startsWith('image/') ? (
            <img
              src={`http://localhost:7000/${file.path}`}
              alt={file.name}
              className="max-h-48 max-w-full"
            />
          ) : (
            <div className="text-center">
              <svg className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Preview not available</p>
            </div>
          )}
          <a
            href={`http://localhost:7000/${file.path}`}
            download
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Download File
          </a>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleDelete}
          className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
        >
          Delete File
        </button>
        <button
          onClick={() => navigate(`/files/${clientId}/upload`)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
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
