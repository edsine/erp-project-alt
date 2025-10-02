import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import logo from '../assets/pgl_logo.png'
import { 
  Home, FileText, ShoppingCart, Calendar, 
  Folder, Users, CheckSquare, DollarSign,
  Menu, X, ChevronLeft, ChevronRight,
  Search, Bell, ChevronDown, LogOut,
  User, Clock, Mail
} from 'lucide-react'

const DashboardLayout = () => {
  const { user, isAuthenticated, loading, error } = useAuth()
  
  const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp';
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Loading user data...</div>
      </div>
    )
  }

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 bg-white shadow-sm transition-all duration-300 ease-in-out
        border-r border-gray-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarOpen ? 'w-64' : 'lg:w-20 w-64'}
      `}>
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${!sidebarOpen ? 'h-16' : ''}`}>
          {sidebarOpen && (
            <div className="flex items-center justify-center w-full">
              <img 
                src={logo} 
                alt="PGL Logo" 
                className="h-9 w-auto max-w-full object-contain"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </button>
        </div>
        
        <nav className="p-4 mt-5">
          <ul className="space-y-1">
            <li>
              <Link
                to=""
                onClick={closeSidebar}
                className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <Home className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                {(sidebarOpen || window.innerWidth < 1024) && (
                  <span className="ml-3">Dashboard</span>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="memos"
                onClick={closeSidebar}
                className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                {(sidebarOpen || window.innerWidth < 1024) && (
                  <span className="ml-3">Memos</span>
                )}
              </Link>
            </li>
            <li>
            <Link
              to="direct-memos"
              onClick={closeSidebar}
              className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
            >
              <Mail className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
              {(sidebarOpen || window.innerWidth < 1024) && (
                <span className="ml-3">Direct Memos</span>
              )}
            </Link>
          </li>
            <li>
              <Link
                to="requisitions"
                onClick={closeSidebar}
                className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                {(sidebarOpen || window.innerWidth < 1024) && (
                  <span className="ml-3">Requisitions</span>
                )}
              </Link>
            </li>
            {user && user.role === 'staff' && (
              <li>
                <Link
                  to="tasks"
                  onClick={closeSidebar}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <CheckSquare className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                  {(sidebarOpen || window.innerWidth < 1024) && (
                    <span className="ml-3">Tasks</span>
                  )}
                </Link>
              </li>
            )}
            {user && user.role === 'staff' && (
              <li>
                <Link
                  to="users"
                  onClick={closeSidebar}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                  {(sidebarOpen || window.innerWidth < 1024) && (
                    <span className="ml-3">Users</span>
                  )}
                </Link>
              </li>
            )}
            <li>
              <Link
                to="leaves"
                onClick={closeSidebar}
                className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <Calendar className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                {(sidebarOpen || window.innerWidth < 1024) && (
                  <span className="ml-3">Leaves</span>
                )}
              </Link>
            </li>
            <li>
              <Link
                to="files"
                onClick={closeSidebar}
                className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <Folder className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                {(sidebarOpen || window.innerWidth < 1024) && (
                  <span className="ml-3">Files</span>
                )}
              </Link>
            </li>
            {user && user.role === 'finance' && (
              <li>
                <Link
                  to="payroll"
                  onClick={closeSidebar}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <DollarSign className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                  {(sidebarOpen || window.innerWidth < 1024) && (
                    <span className="ml-3">Payroll</span>
                  )}
                </Link>
              </li>
            )}
          </ul>

        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <div className="flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* <Link to='/dashboard/notifications' className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Link> */}
              
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1 transition-colors"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-24">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || 'Role'}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                    <div className="py-1">

                      <button 
                        onClick={handleLogout} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout