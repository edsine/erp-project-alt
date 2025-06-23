import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TaskList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tasks when component mounts or user changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/tasks/user/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user?.id]);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUserLoading(true);
        const response = await fetch(`${BASE_URL}/users`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        // Assuming the API returns the array directly (not nested under 'users')
        setUsers(data || []);
      } catch (err) {
        setError(err.message);
        setUsers([]);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUsers();
  }, []);

const filteredTasks = tasks.filter(task => {
  const title = task.title ?? '';
  const assignedTo = task.assigned_to ?? '';
  return (
    title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );
});


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

 const handleAddTask = async () => {
  if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
    setError('Please fill all required fields');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: newTask.title,
        dueDate: newTask.dueDate,
        priority: newTask.priority || 'medium',
        status: 'pending',
        assignedTo: newTask.assignedTo,
        createdBy: user.id, // 👈 correctly named to match backend expectation
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add task');
    }

    const result = await response.json();
    const createdTask = {
      id: result.taskId,
      ...newTask,
      createdBy: user.id,
      status: 'pending'
    };

    setTasks([createdTask, ...tasks]);
    setNewTask({
      title: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
    });
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({ userId: user.id, status: newStatus })

      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      setTasks(tasks.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Task Management</h2>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              placeholder="Task title *"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            {userLoading ? (
              <select 
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option>Loading users...</option>
              </select>
            ) : (
              <select
                name="assignedTo"
                value={newTask.assignedTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <input
              type="date"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex space-x-2">
            <select
              name="priority"
              value={newTask.priority}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={handleAddTask}
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const assignedUser = users.find(u => u.id === task.assigned_to);
                const assignedToName = assignedUser 
                  ? `${assignedUser.name} (${assignedUser.email})`
                  : task.assigned_to || 'Unassigned';

                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignedToName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.priority === 'high' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          High
                        </span>
                      )}
                      {task.priority === 'medium' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Medium
                        </span>
                      )}
                      {task.priority === 'low' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Low
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskList;