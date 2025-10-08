import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import axios from 'axios';
import {
  FileText, ShoppingCart, CheckSquare, Calendar,
  Plus, Clock, User, AlertTriangle,
  Home, Bell, Activity, ArrowRight,
  PieChart // Add this import
} from 'lucide-react';

const Dashboard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const [stats, setStats] = useState({
    memos: 0,
    requisitions: 0,
    tasks: 0,
    leaves: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memoCount, setMemoCount] = useState(0);
  const [requisitionCount, setRequisitionCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [directMemoCount, setDirectMemoCount] = useState(0);

  // Check if user has access to finance features
  const hasFinanceAccess = () => {
    return user && (
      user.role === 'finance' || 
      user.role === 'chairman' || 
      user.department === 'finance' ||
      user.role === 'admin'
    )
  }

  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/tasks/counts/user/${user.id}`);
        const data = await res.json();
        if (data.success) setTaskCount(data.count);
      } catch (error) {
        console.error('Error fetching task count:', error);
      }
    };

    const fetchDirectMemoCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/direct-memos/count/user/${user.id}`);
        const data = await res.json();
        setDirectMemoCount(data.count || 0);
      } catch (err) {
        console.error("Error fetching direct memo count:", err);
      }
    };

    const fetchRequisitionCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/requisitions/count/user/${user.id}?role=${user.role}`);
        const data = await res.json();
        
        console.log('Requisition count response:', data);
        
        if (data.success) {
          setRequisitionCount(data.count || 0);
        } else {
          console.error('Failed to fetch requisition count:', data.message);
          setRequisitionCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch requisition count:', err);
        setRequisitionCount(0);
      }
    };

    const fetchMemoCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/memos/counts/${user.id}`);
        const data = await res.json();
        setMemoCount(data.count || 0);
      } catch (err) {
        console.error("Error fetching memo count:", err);
      }
    };

    const fetchLeaveCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/leave-requests/count/user/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setLeaveCount(data.count || 0);
        } else {
          console.error("Failed to fetch leave count:", data.error);
        }
      } catch (err) {
        console.error("Error fetching leave count:", err);
      }
    };

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        try {
          const countsResponse = await Promise.all([
            axios.get(`${BASE_URL}/api/memos/count`),
            axios.get(`${BASE_URL}/api/requisitions/count`),
            axios.get(`${BASE_URL}/api/tasks/count`),
            axios.get(`${BASE_URL}/api/leave/count`)
          ]);
          
          setStats({
            memos: countsResponse[0].data.count || 0,
            requisitions: countsResponse[1].data.count || 0,
            tasks: countsResponse[2].data.count || 0,
            leaves: countsResponse[3].data.count || 0
          });
        } catch (countsError) {
          console.log('Generic count endpoints not available, using individual endpoints');
        }

        try {
          const activitiesResponse = await axios.get(`${BASE_URL}/api/activities/recent`);
          setRecentActivities(Array.isArray(activitiesResponse.data) ? activitiesResponse.data : []);
        } catch (activitiesError) {
          console.error('Error fetching activities:', activitiesError);
          setRecentActivities([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    // Call all fetch functions
    if (user) {
      fetchTaskCount();
      fetchRequisitionCount();
      fetchMemoCount();
      fetchLeaveCount();
      fetchDirectMemoCount();
      fetchDashboardData();
      
      // Set up interval for refreshing counts
      const interval = setInterval(() => {
        fetchMemoCount();
        fetchRequisitionCount();
        fetchTaskCount();
        fetchLeaveCount();
        fetchDirectMemoCount();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user, BASE_URL]);

  const getFirstName = () => user?.name?.split(' ')[0] || 'User';

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-64 bg-gray-100 rounded-lg"></div>
            <div className="h-64 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const StatCard = ({ icon: Icon, title, value, color, link }) => (
    <Link to={link} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-light mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 
          color === 'green' ? 'bg-green-50 text-green-600' :
          color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
          color === 'purple' ? 'bg-purple-50 text-purple-600' : 
          color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6">
        <span className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors">
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </span>
      </div>
    </Link>
  );
const QuickAction = ({ icon: Icon, title, description, link, color }) => (
  <Link 
    to={link} 
    className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all group"
  >
    <div className={`p-2 rounded-lg ${
      color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 
      color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
      color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' : 
      'bg-gray-50 text-gray-600'
    }`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="ml-3 flex-1">
      <h3 className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors mt-1" />
  </Link>
);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-gray-800">Welcome back,</h1>
          <h2 className="text-3xl font-semibold text-primary">{getFirstName()}</h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={FileText} 
          title="Memos" 
          value={memoCount} 
          color="blue" 
          link="/dashboard/memos" 
        />
        <StatCard 
          icon={FileText} 
          title="Direct Memos" 
          value={directMemoCount} 
          color="blue" 
          link="/dashboard/direct-memos" 
        />
        <StatCard 
          icon={ShoppingCart} 
          title="Requisitions" 
          value={requisitionCount} 
          color="green" 
          link="/dashboard/requisitions" 
        />
        <StatCard 
          icon={CheckSquare} 
          title="Tasks" 
          value={taskCount} 
          color="yellow" 
          link="/dashboard/tasks" 
        />
        <StatCard 
          icon={Calendar} 
          title="Leaves" 
          value={leaveCount}
          color="purple" 
          link="/dashboard/leaves" 
        />
        
        {/* Finance Dashboard Card - Only for authorized users */}
        {hasFinanceAccess() && (
          <StatCard 
            icon={PieChart} 
            title="Finance Dashboard" 
            value="View" 
            color="indigo" 
            link="/dashboard/finance" 
          />
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light text-gray-800">Recent Activities</h2>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 text-xs rounded-md ${activeTab === 'all' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1 text-xs rounded-md ${activeTab === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1 text-xs rounded-md ${activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities
                .filter(activity => {
                  if (activeTab === 'all') return true;
                  if (activeTab === 'pending') return activity.status === 'pending';
                  if (activeTab === 'completed') return activity.status === 'completed';
                  return true;
                })
                .map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-500">No activities found</h3>
                <p className="mt-1 text-xs text-gray-400">Your activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-light text-gray-800 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <QuickAction
              icon={Plus}
              title="Create New Memo"
              description="Send a memo to your team"
              link="/dashboard/memos/new"
              color="blue"
            />
            <QuickAction
              icon={Plus}
              title="Create Requisition"
              description="Request new items or services"
              link="/dashboard/requisitions/new"
              color="green"
            />
            <QuickAction
              icon={Plus}
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