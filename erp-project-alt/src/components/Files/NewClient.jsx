import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NewClient = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await axios.post(
      `${BASE_URL}/files/clients`,
      {
        name: formData.name.trim(),
        code: formData.code.trim()
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    setSuccess('Client created successfully!');
    setTimeout(() => navigate('/dashboard/files'), 1500);
    
  } catch (err) {
    if (err.response?.data?.errorType === 'DUPLICATE_NAME_CODE') {
      setError('This exact client name and code combination already exists');
    } else {
      setError(err.response?.data?.message || 'Failed to create client');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Create New Client</h2>
        <button
          onClick={() => navigate('/dashboard/files')} // Fixed navigation path
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm sm:text-base">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm sm:text-base"
              placeholder="e.g. National Institute of Transport Technology"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Client Code *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm sm:text-base"
              placeholder="e.g. NITT"
            />
            <p className="mt-1 text-xs text-gray-500">Unique identifier for the client</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/files')} // Fixed navigation path
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewClient;