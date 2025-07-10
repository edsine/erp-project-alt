import { useState } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const UploadFile = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { clientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      description: '',
      originalName: file.name
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleNameChange = (index, newName) => {
    const updatedFiles = [...files];
    updatedFiles[index].name = newName;
    setFiles(updatedFiles);
  };

  const handleDescriptionChange = (index, description) => {
    const updatedFiles = [...files];
    updatedFiles[index].description = description;
    setFiles(updatedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  if (files.length === 0) {
    setError('Please select at least one file to upload');
    setLoading(false);
    return;
  }

  const token = localStorage.getItem('token');
  
  if (!token) {
    setError('Authentication required. Please login again.');
    setLoading(false);
    navigate('/login');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('category', category);
    formData.append('uploaded_by', user.id);
    
    // Add each file and its metadata
    files.forEach((fileObj, index) => {
      formData.append('files', fileObj.file); // Simple field name for files array
      formData.append(`names[${index}]`, fileObj.name);
      formData.append(`descriptions[${index}]`, fileObj.description);
    });

    const response = await axios.post(`${BASE_URL}/files/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 201) {
      setSuccess(`${files.length} file(s) uploaded successfully!`);
      setTimeout(() => {
        navigate(`/dashboard/files/${clientId}`);
      }, 1500);
    }
  } catch (err) {
    console.error('Upload error:', err);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      setError('Session expired. Please login again.');
      navigate('/login');
    } else if (err.response?.data?.message?.includes('File type not allowed')) {
      setError('Invalid file type. Only PDF, DOC, XLS, JPG, PNG, and TXT files are allowed.');
    } else {
      setError(err.response?.data?.message || 'Failed to upload files');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-auto max-w-4xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Upload Files</h2>
      
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

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm sm:text-base"
            required
          >
            <option value="requisition">Requisition</option>
            <option value="memo">Memo</option>
            <option value="contract">Contract</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Files <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center items-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                >
                  <span>Select files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
                <p className="mt-1 sm:mt-0 sm:pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {files.length > 0 ? (
                  <span className="font-medium">{files.length} file(s) selected</span>
                ) : (
                  'PDF, DOC, XLS up to 10MB each'
                )}
              </p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Selected Files</h3>
            <div className="space-y-3">
              {files.map((fileObj, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={fileObj.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        className="w-full px-2 py-1 border-b border-gray-300 focus:outline-none focus:border-primary text-sm sm:text-base"
                        required
                      />
                      <p className="text-xs text-gray-500 truncate">Original: {fileObj.originalName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    placeholder="Description (optional)"
                    rows="2"
                    value={fileObj.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-xs sm:text-sm"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {fileObj.file.type} • {formatFileSize(fileObj.file.size)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/files/${clientId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className={`px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors ${
              loading || files.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              `Upload ${files.length} File(s)`
            )}
          </button>
        </div>
      </form>
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

export default UploadFile;