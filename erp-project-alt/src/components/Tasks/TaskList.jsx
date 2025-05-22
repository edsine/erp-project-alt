import { useState } from 'react'

const TaskList = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Complete project proposal',
      assignedTo: 'John Doe',
      dueDate: '2023-06-20',
      priority: 'high',
      status: 'in-progress',
    },
    {
      id: 2,
      title: 'Review budget report',
      assignedTo: 'Jane Smith',
      dueDate: '2023-06-15',
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Update employee handbook',
      assignedTo: 'Mike Johnson',
      dueDate: '2023-06-25',
      priority: 'low',
      status: 'completed',
    },
  ])

  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddTask = () => {
    if (newTask.title && newTask.assignedTo && newTask.dueDate) {
      setTasks([...tasks, {
        id: tasks.length + 1,
        title: newTask.title,
        assignedTo: newTask.assignedTo,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        status: 'pending'
      }])
      setNewTask({
        title: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
      })
    }
  }

  const handleStatusChange = (id, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status: newStatus } : task
    ))
  }

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
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

      <div className="mb-6 p-4 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              placeholder="Task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <input
              type="text"
              name="assignedTo"
              value={newTask.assignedTo}
              onChange={handleInputChange}
              placeholder="Assign to"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary"
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
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.dueDate}
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
                      <option value="in-progress">In Progress</option>
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
              ))
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
  )
}

export default TaskList