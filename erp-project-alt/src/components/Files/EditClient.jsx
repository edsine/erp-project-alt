import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditClient = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${BASE_URL}/files/clients/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch client');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/files/clients/${clientId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Client updated successfully!');
      setTimeout(() => {
        navigate('/dashboard/files'); // Fixed navigation path
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${BASE_URL}/files/clients/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigate('/dashboard/files');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete client');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading client data...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Edit Client</h2>
        <button
          onClick={() => navigate('/dashboard/files')} 
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

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
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:text-base sm:order-first"
          >
            Delete Client
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;