import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const FileList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${BASE_URL}/files/clients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setClients(response.data.data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch clients');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Loading clients...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Client Files</h2>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link
            to="new-client"
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-center"
          >
            New Client
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <div key={client.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow relative">
              <Link
                to={`edit-client/${client.id}`}
                className="absolute top-2 right-2 text-gray-400 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <Link to={`/dashboard/files/${client.id}`} className="block">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    {client.code.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate">{client.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{client.code}</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {client.file_count} {client.file_count === 1 ? 'file' : 'files'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No clients found
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;