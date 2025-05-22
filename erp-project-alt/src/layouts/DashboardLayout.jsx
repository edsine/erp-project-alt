import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  // Mock user data - replace with actual user data from context/state
  const user = {
    name: 'John Doe',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  }

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white shadow-md transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-primary">ERP System</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary">E</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {sidebarOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {sidebarOpen && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/memos"
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {sidebarOpen && <span className="ml-3">Memos</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/requisitions"
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {sidebarOpen && <span className="ml-3">Requisitions</span>}
              </Link>
            </li>
            {user.role === 'admin' && (
              <li>
                <Link
                  to="/tasks"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
                >
                  <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {sidebarOpen && <span className="ml-3">Task Management</span>}
                </Link>
              </li>
            )}
            {user.role === 'admin' && (
              <li>
                <Link
                  to="/users"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
                >
                  <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {sidebarOpen && <span className="ml-3">User Management</span>}
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/leaves"
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {sidebarOpen && <span className="ml-3">Leave Requests</span>}
              </Link>
            </li>
            {user.role === 'finance' && (
              <li>
                <Link
                  to="/payroll"
                  className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100 group"
                >
                  <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {sidebarOpen && <span className="ml-3">Payroll</span>}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="relative">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <img className="h-8 w-8 rounded-full" src={user.avatar} alt="User profile" />
                  {sidebarOpen && <span className="text-sm font-medium text-gray-700">{user.name}</span>}
                </button>
                <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout