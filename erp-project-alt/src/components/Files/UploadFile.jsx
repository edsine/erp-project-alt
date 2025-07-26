import { useState } from 'react'; 
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FiUpload, FiX, FiChevronRight, FiFile,
  FiArrowLeft, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';

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
      
      files.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-auto max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link to="/dashboard/files" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Files
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <FiChevronRight className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">Upload Files</span>
            </div>
          </li>
        </ol>
      </nav>

      <h2 className="text-2xl font-light text-gray-800 mb-2">Upload Files</h2>
      <p className="text-sm text-gray-500 mb-6">Add new documents to this client's file archive</p>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
            required
          >
            <option value="requisition">Requisition</option>
            <option value="memo">Memo</option>
            <option value="contract">Contract</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Files <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors">
            <div className="space-y-3 text-center">
              <FiUpload className="mx-auto h-10 w-10 text-gray-400" />
              <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center items-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none transition-colors"
                >
                  <span>Click to select files</span>
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
                  <span className="font-medium text-primary">{files.length} file(s) selected</span>
                ) : (
                  'Supports: PDF, DOC, XLS, JPG, PNG, TXT (Max 10MB each)'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Selected Files</h3>
            <div className="space-y-3">
              {files.map((fileObj, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <FiFile className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                        <input
                          type="text"
                          value={fileObj.name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          className="w-full px-3 py-1 border-b border-gray-300 focus:outline-none focus:border-primary text-sm"
                          placeholder="Enter file name"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 truncate ml-6">Original: {fileObj.originalName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="Add description (optional)"
                    rows="2"
                    value={fileObj.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
                  />
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>{fileObj.file.type}</span>
                    <span>{formatFileSize(fileObj.file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/files/${clientId}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className={`px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
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
              <span className="flex items-center">
                <FiUpload className="mr-2 h-4 w-4" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </span>
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