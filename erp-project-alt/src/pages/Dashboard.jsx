import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import axios from 'axios';

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

  const [memoCount, setMemoCount] = useState(0)

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

  // Extract first name from user.name (assuming it's "First Last" format)
  const getFirstName = () => {
    if (user?.name) {
      return user.name.split(' ')[0]
    }
    return 'User' // fallback if name is not available
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl text-primary mt-6 font-bold">Welcome, {getFirstName()}.</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Memos</p>
              <p className="text-2xl font-semibold">  {memoCount}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/dashboard/memos" className="text-sm text-primary hover:underline">View all memos</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Requisitions</p>
              <p className="text-2xl font-semibold">{requisitionCount}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="requisitions" className="text-sm text-primary hover:underline">View all requisitions</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasks</p>
              <p className="text-2xl font-semibold">{taskCount}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/dashboard/tasks" className="text-sm text-primary hover:underline">View all tasks</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Leave Requests</p>
              <p className="text-2xl font-semibold">{stats.leaves}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/dashboard/leaves" className="text-sm text-primary hover:underline">View all leaves</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Activities</h2>
            {/* <Link to="/activities" className="text-sm text-primary hover:underline">View all</Link> */}
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'Memo' && (
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    {activity.type === 'Requisition' && (
                      <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    )}
                    {activity.type === 'Task' && (
                      <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                    )}
                    {activity.type === 'Leave' && (
                      <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.type} • {activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities found</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/dashboard/memos/new"
              className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Create New Memo</p>
              </div>
            </Link>
            <Link
              to="requisitions/new"
              className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Create New Requisition</p>
              </div>
            </Link>
            <Link
              to="/dashboard/leaves/new"
              className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Request Leave</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard