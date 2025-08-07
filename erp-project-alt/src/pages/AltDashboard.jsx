import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText, FiShoppingCart, FiCheckSquare, FiCalendar,
  FiPlus, FiClock, FiUser, FiHome, FiBell, 
  FiActivity, FiArrowRight
} from 'react-icons/fi';

const Dashboard = () => {
  // Mock data - completely self-contained
  const mockData = {
    stats: {
      memos: 12,
      requisitions: 5,
      tasks: 8,
      leaves: 3
    },
    recentActivities: [
      {
        id: 1,
        type: 'Memo',
        title: 'Monthly team meeting scheduled',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
      },
      {
        id: 2,
        type: 'Requisition',
        title: 'New office chairs request',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 24) // 1 day ago
      },
      {
        id: 3,
        type: 'Task',
        title: 'Complete Q2 financial report',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 48) // 2 days ago
      },
      {
        id: 4,
        type: 'Leave',
        title: 'Annual leave request',
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 168) // 1 week ago
      }
    ]
  };

  const [dashboardData] = useState(mockData);
  const user = { name: "Samuel" }; // Mock user

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

  // Stat Card Component
  const StatCard = ({ icon: Icon, title, value, color, link }) => (
    <Link to={link} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-light mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}-50 text-${color}-600`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6">
        <span className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors">
          View all
          <FiArrowRight className="ml-1 h-4 w-4" />
        </span>
      </div>
    </Link>
  );

  // Activity Item Component
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
            {activityIcons[activity.type] || <FiActivity className="h-5 w-5 text-gray-600" />}
          </div>
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[activity.status] || 'bg-gray-100 text-gray-800'}`}>
              {activity.status}
            </span>
          </div>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <span className="capitalize">{activity.type.toLowerCase()}</span>
            <span className="mx-2">•</span>
            <FiClock className="mr-1 h-3 w-3" />
            <span>{formatTimeAgo(activity.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Quick Action Component
  const QuickAction = ({ icon: Icon, title, description, link, color }) => (
    <Link
      to={link}
      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className={`flex-shrink-0 h-10 w-10 rounded-full ${color}-50 flex items-center justify-center text-${color}-600 group-hover:bg-${color}-100 transition-colors`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-800">Welcome back,</h1>
          <h2 className="text-3xl font-semibold text-primary">{user.name}</h2>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <button className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors relative">
            <FiBell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={FiFileText} 
          title="Memos" 
          value={dashboardData.stats.memos} 
          color="blue" 
          link="/dashboard/memos" 
        />
        <StatCard 
          icon={FiShoppingCart} 
          title="Requisitions" 
          value={dashboardData.stats.requisitions} 
          color="green" 
          link="/dashboard/requisitions" 
        />
        <StatCard 
          icon={FiCheckSquare} 
          title="Tasks" 
          value={dashboardData.stats.tasks} 
          color="yellow" 
          link="/dashboard/tasks" 
        />
        <StatCard 
          icon={FiCalendar} 
          title="Leaves" 
          value={dashboardData.stats.leaves} 
          color="purple" 
          link="/dashboard/leaves" 
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-light text-gray-800">Recent Activities</h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {dashboardData.recentActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200 text-center">
            <Link 
              to="/dashboard/activities" 
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center justify-center w-full"
            >
              View all activities
              <FiArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-light text-gray-800 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <QuickAction
              icon={FiPlus}
              title="Create New Memo"
              description="Send a memo to your team"
              link="/dashboard/memos/new"
              color="blue"
            />
            <QuickAction
              icon={FiPlus}
              title="Create Requisition"
              description="Request new items or services"
              link="/dashboard/requisitions/new"
              color="green"
            />
            <QuickAction
              icon={FiPlus}
              title="Request Leave"
              description="Submit a leave application"
              link="/dashboard/leaves/new"
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;