import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText, FiShoppingCart, FiCheckSquare, FiCalendar,
  FiClock, FiFilter, FiArrowLeft, FiSearch, FiUser
} from 'react-icons/fi';

const ActivitiesPage = () => {
  // Mock data - completely self-contained
  const allActivities = [
    {
      id: 1,
      type: 'Memo',
      title: 'Monthly team meeting scheduled',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      user: 'John Doe'
    },
    {
      id: 2,
      type: 'Requisition',
      title: 'New office chairs request',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      user: 'Jane Smith'
    },
    {
      id: 3,
      type: 'Task',
      title: 'Complete Q2 financial report',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 48), // 2 days ago
      user: 'Mike Johnson'
    },
    {
      id: 4,
      type: 'Leave',
      title: 'Annual leave request',
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 168), // 1 week ago
      user: 'Sarah Williams'
    },
    {
      id: 5,
      type: 'Memo',
      title: 'Policy update notification',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 72), // 3 days ago
      user: 'Admin'
    },
    {
      id: 6,
      type: 'Requisition',
      title: 'Software license renewal',
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 96), // 4 days ago
      user: 'Alex Brown'
    }
  ];

  // State for filters
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Format date as "2 hours ago", "1 day ago", etc.
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'Just now';
  };

  // Filter activities
  const filteredActivities = allActivities
    .filter(activity => {
      if (filter === 'all') return true;
      return activity.status === filter;
    })
    .filter(activity => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query) ||
        activity.status.toLowerCase().includes(query) ||
        activity.user.toLowerCase().includes(query)
      );
    });

  // Activity Item Component (reused from dashboard)
  const ActivityItem = ({ activity }) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const activityIcons = {
      Memo: <FiFileText className="h-5 w-5 text-blue-600" />,
      Requisition: <FiShoppingCart className="h-5 w-5 text-green-600" />,
      Task: <FiCheckSquare className="h-5 w-5 text-yellow-600" />,
      Leave: <FiCalendar className="h-5 w-5 text-purple-600" />
    };

    return (
      <div className="flex items-start p-4 hover:bg-gray-50 transition-colors">
        <div className="flex-shrink-0 mt-1">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {activityIcons[activity.type] || <FiFileText className="h-5 w-5 text-gray-600" />}
          </div>
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span className="capitalize">{activity.type.toLowerCase()}</span>
                <span className="mx-2">•</span>
                <FiClock className="mr-1 h-3 w-3" />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </div>
            </div>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[activity.status] || 'bg-gray-100 text-gray-800'}`}>
              {activity.status}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <FiUser className="inline mr-1 h-3 w-3" />
            {activity.user}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">All Activities</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-gray-200">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-12">
            <FiFilter className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-500">No activities found</h3>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery ? 'Try a different search term' : 'No activities match the current filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ActivitiesPage;
