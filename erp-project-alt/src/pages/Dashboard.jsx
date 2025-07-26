import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import axios from 'axios';
import { 
  FiHome, FiFileText, FiShoppingCart, FiCalendar, 
  FiFolder, FiPlus, FiCheckCircle, FiClock, 
  FiUser, FiDollarSign, FiBell, FiSearch
} from 'react-icons/fi';

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

  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/tasks/counts/user/${user.id}`);
        const data = await res.json();
        if (data.success) {
          setTaskCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching task count:', error);
      }
    };

    if (user) {
      fetchTaskCount();
    }
  }, [user]);

useEffect(() => {
  fetch(`${BASE_URL}/requisitions/count/user/${user.id}`)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.count === 'number') {
        setRequisitionCount(data.count);
      }
    })
    .catch(err => console.error('Failed to fetch requisition count:', err));
}, [user]);

useEffect(() => {
  let interval
  if (user?.id) {
    const fetchMemoCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/memos/counts/${user.id}`)
        const data = await res.json()
        setMemoCount(data.count || 0)
      } catch (err) {
        console.error("Error fetching memo count:", err)
      }
    }

    fetchMemoCount()
    interval = setInterval(fetchMemoCount, 60000) // refresh every 60 seconds
  }

  return () => clearInterval(interval)
}, [user?.id])



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch counts
        const countsResponse = await Promise.all([
          axios.get('/api/memos/count'),
          axios.get('/api/requisitions/count'),
          axios.get('/api/tasks/count'),
          axios.get('/api/leave/count')
        ]);
        
        setStats({
          memos: countsResponse[0].data.count || 0,
          requisitions: countsResponse[1].data.count || 0,
          tasks: countsResponse[2].data.count || 0,
          leaves: countsResponse[3].data.count || 0
        });

        // Fetch recent activities with error handling
        try {
          const activitiesResponse = await axios.get('/api/activities/recent');
          // Ensure the response is an array
          const activities = Array.isArray(activitiesResponse.data) 
            ? activitiesResponse.data 
            : [];
          setRecentActivities(activities);
        } catch (activitiesError) {
          console.error('Error fetching activities:', activitiesError);
          setRecentActivities([]); // Set empty array as fallback
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        // Ensure recentActivities is still an array even on error
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);
  // Function to get the first name of the user
  const getFirstName = () => {
    if (user?.name) {
      return user.name.split(' ')[0]
    }
    return 'User'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-gray-800">Welcome back,</h1>
          <h2 className="text-4xl font-semibold text-primary">{getFirstName()}</h2>
          <p className="text-gray-500 mt-1">Here's what's happening today</p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Memo Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Memos</p>
              <p className="text-3xl font-light mt-1">{memoCount}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-primary">
              <FiFileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              to="/dashboard/memos" 
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
            >
              View all memos
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Requisition Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Requisitions</p>
              <p className="text-3xl font-light mt-1">{requisitionCount}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <FiShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              to="requisitions" 
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
            >
              View all requisitions
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Task Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tasks</p>
              <p className="text-3xl font-light mt-1">{taskCount}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
              <FiCheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              to="/dashboard/tasks" 
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
            >
              View all tasks
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Leave Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Leaves</p>
              <p className="text-3xl font-light mt-1">{stats.leaves}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <FiCalendar className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <Link 
              to="/dashboard/leaves" 
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
            >
              View all leaves
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
            <button className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div 
                  key={activity.id} 
                  className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'Memo' && (
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                        <FiFileText className="h-5 w-5" />
                      </div>
                    )}
                    {activity.type === 'Requisition' && (
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <FiShoppingCart className="h-5 w-5" />
                      </div>
                    )}
                    {activity.type === 'Task' && (
                      <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <FiCheckCircle className="h-5 w-5" />
                      </div>
                    )}
                    {activity.type === 'Leave' && (
                      <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <FiCalendar className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <span className="capitalize">{activity.type.toLowerCase()}</span>
                      <span className="mx-2">•</span>
                      <FiClock className="h-4 w-4 mr-1" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                  <FiClock className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-500">No recent activities</h3>
                <p className="mt-1 text-sm text-gray-400">Your activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
          
          <div className="space-y-4">
            <Link
              to="/dashboard/memos/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:bg-blue-100 transition-colors">
                <FiPlus className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Create New Memo</p>
                <p className="text-xs text-gray-500 mt-1">Send a memo to your team</p>
              </div>
            </Link>
            
            <Link
              to="requisitions/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                <FiPlus className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Create New Requisition</p>
                <p className="text-xs text-gray-500 mt-1">Request new items or services</p>
              </div>
            </Link>
            
            <Link
              to="/dashboard/leaves/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                <FiPlus className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Request Leave</p>
                <p className="text-xs text-gray-500 mt-1">Submit a leave application</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard