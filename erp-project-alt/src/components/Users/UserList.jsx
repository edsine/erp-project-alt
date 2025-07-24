import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
const UserList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth()
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: '',
    is_admin: 0
  });

  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '', // Added password field for editing
    role: 'staff',
    department: '',
    is_admin: 0
  });

  const [showPassword, setShowPassword] = useState(false); // For toggling password visibility
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/users`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department || !newUser.password) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add user');
      }

      alert('User added successfully!');

      setUsers([...users, { ...newUser, id: responseData.user_id }]);

      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        department: '',
        is_admin: 0
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUser({
      name: user.name,
      email: user.email,
      password: '', // Initialize with empty password
      role: user.role,
      department: user.department,
      is_admin: user.is_admin
    });
  };

  const handleUpdateUser = async () => {
    const userData = {
      id: editingUserId,
      ...editUser,
    };

    try {
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Update failed:', result.message);
        alert(result.message || 'Something went wrong');
        return;
      }

      // Update local list
      setUsers(prev =>
        prev.map(u => (u.id === userData.id ? { ...u, ...userData } : u))
      );

      alert('User updated successfully!');
      setEditingUserId(null);
    } catch (error) {
      console.error('❌ API error:', error);
      alert('Failed to update user. Please try again.');
    }
  };



  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      setUsers(users.map(user =>
        user.id === id ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center py-8">Loading users...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 p-4 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {editingUserId ? 'Edit User' : 'Add New User'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <input
              type="text"
              name="name"
              value={editingUserId ? editUser.name : newUser.name}
              onChange={editingUserId ? handleEditInputChange : handleInputChange}
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              value={editingUserId ? editUser.email : newUser.email}
              onChange={editingUserId ? handleEditInputChange : handleInputChange}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={editingUserId ? editUser.password : newUser.password}
                onChange={editingUserId ? handleEditInputChange : handleInputChange}
                placeholder={editingUserId ? "New password (leave blank to keep current)" : "Password"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <select
              name="department"
              value={editingUserId ? editUser.department : newUser.department}
              onChange={editingUserId ? handleEditInputChange : handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Department</option>
              <option value="ICT">ICT</option>
              <option value="finance">Finance</option>
              <option value="Utility">Utility</option>
              <option value="Tender">Tender</option>
              <option value="hr">HR</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <select
              name="role"
              value={editingUserId ? editUser.role : newUser.role}
              onChange={editingUserId ? handleEditInputChange : handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="staff">Staff</option>
              <option value="hr">HR</option>
              <option value="gmd">GMD</option>
              <option value="finance">Finance</option>
              <option value="chairman">Chairman</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div>
            {editingUserId ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateUser}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Update
                </button>



                <button
                  onClick={handleCancelEdit}
                  className="w-full px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddUser}
                className="w-full px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
              >
                Add User
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role || 'Not assigned'} {/* Add fallback */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {user.is_admin ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;