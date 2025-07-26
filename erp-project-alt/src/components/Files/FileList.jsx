import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  FiEdit2, FiGrid, FiList, FiTable, FiLayers,
  FiSearch, FiPlus, FiChevronDown, FiFile
} from 'react-icons/fi';

const FileList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState('grid'); // 'grid', 'list', 'table', 'card'

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

  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {filteredClients.map(client => (
        <div key={client.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
          <Link to={`/dashboard/files/${client.id}`} className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-primary font-medium">
                {client.code.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                <p className="text-sm text-gray-500 truncate">{client.code}</p>
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <FiFile className="mr-1 h-3 w-3" />
                    {client.file_count} {client.file_count === 1 ? 'file' : 'files'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
          <Link
            to={`edit-client/${client.id}`}
            className="absolute top-3 right-3 text-gray-400 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit2 className="h-5 w-5" />
          </Link>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {filteredClients.map(client => (
        <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
          <Link to={`/dashboard/files/${client.id}`} className="block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-medium">
                  {client.code.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{client.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <FiFile className="mr-1 h-3 w-3" />
                  {client.file_count} {client.file_count === 1 ? 'file' : 'files'}
                </span>
                <Link
                  to={`edit-client/${client.id}`}
                  className="text-gray-400 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiEdit2 className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Files
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredClients.map(client => (
            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link to={`/dashboard/files/${client.id}`} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-medium">
                    {client.code.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {client.code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <FiFile className="mr-1 h-3 w-3" />
                  {client.file_count} {client.file_count === 1 ? 'file' : 'files'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`edit-client/${client.id}`}
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  <FiEdit2 className="h-5 w-5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {filteredClients.map(client => (
        <div key={client.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-primary font-medium text-lg">
                {client.code.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                <p className="text-sm text-gray-500">{client.code}</p>
              </div>
            </div>
            <Link
              to={`edit-client/${client.id}`}
              className="text-gray-400 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FiEdit2 className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total files</p>
                <p className="text-xl font-light text-gray-900">{client.file_count}</p>
              </div>
              <Link
                to={`/dashboard/files/${client.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                View files
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-light text-gray-800">Client Files</h2>
          <p className="text-sm text-gray-500">Manage all client files and documents</p>
        </div>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="relative">
              <button
                type="button"
                className="inline-flex justify-center w-full px-3 py-2 bg-white text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                onClick={() => setViewType(prev => {
                  const views = ['grid', 'list', 'table', 'card'];
                  const currentIndex = views.indexOf(prev);
                  return views[(currentIndex + 1) % views.length];
                })}
              >
                {viewType === 'grid' && <FiGrid className="h-4 w-4 mr-1" />}
                {viewType === 'list' && <FiList className="h-4 w-4 mr-1" />}
                {viewType === 'table' && <FiTable className="h-4 w-4 mr-1" />}
                {viewType === 'card' && <FiLayers className="h-4 w-4 mr-1" />}
                <span className="capitalize">{viewType} view</span>
              </button>
            </div>
            
            <Link
              to="new-client"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <FiPlus className="h-4 w-4 mr-1" />
              New Client
            </Link>
          </div>
        </div>
      </div>

      {filteredClients.length > 0 ? (
        <>
          {viewType === 'grid' && renderGridView()}
          {viewType === 'list' && renderListView()}
          {viewType === 'table' && renderTableView()}
          {viewType === 'card' && renderCardView()}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <FiFile className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-500">No clients found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {searchTerm ? 'Try a different search term' : 'Create your first client to get started'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="new-client"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <FiPlus className="h-4 w-4 mr-1" />
                Add New Client
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileList;