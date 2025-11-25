import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import logo from '../assets/pgl_logo.png'
import {
  Home, FileText, ShoppingCart, Calendar,
  Folder, Users, CheckSquare, DollarSign,
  Menu, X, ChevronLeft, ChevronRight,
  Search, Bell, ChevronDown, LogOut,
  User, Clock, Mail, PieChart
} from 'lucide-react'
import { FiSettings, FiKey } from 'react-icons/fi';


const DashboardLayout = () => {
  const { user, isAuthenticated, loading, error } = useAuth()
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState(null);
  const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp';
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
 
  
  // 🔔 Initialize sound using a ref (so it's not recreated)
const notificationSound = useRef(null);

useEffect(() => {
  const sound = new Audio("/sounds/Notification.m4a");
  sound.volume = 0.6;
  notificationSound.current = sound;

  // ✅ Unlock audio for browsers that block autoplay
  const enableAudio = () => {
    sound.play().then(() => sound.pause());
    document.removeEventListener("click", enableAudio);
  };
  document.addEventListener("click", enableAudio);

  return () => document.removeEventListener("click", enableAudio);
}, []);


  // useEffect(() => {
  //   if (!user?.id) return;

  //   const fetchNotifications = async () => {
  //     try {
  //       const res = await fetch(`${BASE_URL}/notifications/${user.id}`);
  //       if (!res.ok) throw new Error("Failed to fetch notifications");

  //       const data = await res.json();
  //       setNotifications(data);
  //       setUnreadCount(data.filter((n) => !n.is_read).length);
  //     } catch (err) {
  //       console.error("Error fetching notifications:", err);
  //     }
  //   };

  //   fetchNotifications();

  //   // 🔁 Poll every 30 seconds
  //   const interval = setInterval(fetchNotifications, 30000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);


  // Handle click outside to close dropdown

 useEffect(() => {
  if (!user?.id) return;

  const seenNotifications = new Set(); // track seen ones across fetches

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();

      // 🧠 Find *truly new* unread notifications
      const newUnread = data.filter(
        (n) => !n.is_read && !seenNotifications.has(n.id)
      );

      // 🔔 Play sound if new ones arrived
      if (newUnread.length > 0 && notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch((err) =>
          console.warn("Autoplay blocked or audio failed:", err)
        );
      }

      // ✅ Update seen set
      data.forEach((n) => seenNotifications.add(n.id));

      // ✅ Update UI
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  fetchNotifications();

  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, [user?.id]);



 
 
 
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

  // Check if user has access to finance features
  const hasFinanceAccess = () => {
    return user && (
      user.role === 'finance' ||
      user.role === 'chairman' ||
      user.department === 'finance' ||
      user.role === 'admin' // Add admin if they should also have access
    )
  }


//   const handleNotificationClick = async (note) => {
//   try {
//     // ✅ Mark as read in backend
//     await fetch(`${BASE_URL}/notifications-mark-read/${note.id}`, {
//       method: "PUT",
//     });

//     // ✅ Update frontend immediately
//     setNotifications((prev) =>
//       prev.map((n) => (n.id === note.id ? { ...n, is_read: 1 } : n))
//     );
//     setUnreadCount((count) => Math.max(count - 1, 0));

//     // ✅ Close dropdown
//     setShowNotifications(false);

//     // ✅ Navigate to memo (or any link)
//     if (note.link) navigate(note.link);
//   } catch (err) {
//     console.error("Failed to mark notification as read:", err);
//   }
// };

// Example notification click


// const handleNotificationClick = async (note) => {
//   try {
//     // ✅ Mark as read in backend
//     const res = await fetch(`${BASE_URL}/notifications-mark-read/${note.id}`, {
//       method: "PUT",
//     });

//     if (!res.ok) throw new Error("Failed to mark as read");

//     // ✅ Update frontend — remove it from the list once read
//     setNotifications((prev) => prev.filter((n) => n.id !== note.id));

//     // ✅ Update unread count
//     setUnreadCount((count) => Math.max(count - 1, 0));

//     // ✅ Close dropdown
//     setShowNotifications(false);

//     // ✅ Extract memo ID (works for both `/dashboard/memos/45` or `/dashboard/memos?memoId=45`)
//     const memoIdMatch = note.link.match(/(\d+)/);
//     if (memoIdMatch) {
//       const memoId = parseInt(memoIdMatch[1]);
//       setSelectedMemoId(memoId);
//       navigate(`/dashboard/memos/${memoId}`);
//     }
//   } catch (err) {
//     console.error("Failed to handle notification click:", err);
//   }
// };


// const handleNotificationClick = async (note) => {
//   try {
//     // ✅ Optimistically remove the notification right away (instant UI feedback)
//     setNotifications((prev) => prev.filter((n) => n.id !== note.id));
//     setUnreadCount((count) => Math.max(count - 1, 0));
//     setShowNotifications(false);

//     // ✅ Mark as read in backend (no need to wait before navigating)
//     fetch(`${BASE_URL}/notifications-mark-read/${note.id}`, { method: "PUT" })
//       .catch((err) => console.error("Failed to mark notification as read:", err));

//     // ✅ Navigate to memo if link exists
//     if (note.link) {
//       const memoIdMatch = note.link.match(/(\d+)/);
//       if (memoIdMatch) {
//         const memoId = parseInt(memoIdMatch[1]);
//         setSelectedMemoId(memoId);
//         navigate(`/dashboard/memos/${memoId}`);
//       } else {
//         console.warn("No memo ID found in link:", note.link);
//       }
//     } else {
//       console.warn("Notification has no link:", note);
//     }
//   } catch (err) {
//     console.error("Error handling notification click:", err);
//   }
// };

const handleNotificationClick = async (note) => {
  try {
    // ✅ Optimistic UI updates
    setNotifications((prev) => prev.filter((n) => n.id !== note.id));
    setUnreadCount((count) => Math.max(count - 1, 0));
    setShowNotifications(false);

    // ✅ Mark as read in backend
    fetch(`${BASE_URL}/notifications-mark-read/${note.id}`, { method: "PUT" })
      .catch((err) => console.error("Failed to mark notification as read:", err));

    // ✅ Navigate based on link
    if (note.link) {
      if (note.link.includes("/memos/")) {
        const memoIdMatch = note.link.match(/\/memos\/(\d+)/);
        if (memoIdMatch) {
          const memoId = parseInt(memoIdMatch[1]);
          setSelectedMemoId(memoId);
          navigate(`/dashboard/memos/${memoId}`);
          return;
        }
      }

      if (note.link.includes("/requisitions/")) {
        const reqIdMatch = note.link.match(/\/requisitions\/(\d+)/);
        if (reqIdMatch) {
          const requisitionId = parseInt(reqIdMatch[1]);
          setSelectedRequisitionId?.(requisitionId); // optional state
          navigate(`/dashboard/requisitions/${requisitionId}`);
          return;
        }
      }

      // fallback for other links
      navigate(note.link);
    } else {
      console.warn("Notification has no link:", note);
    }
  } catch (err) {
    console.error("Error handling notification click:", err);
  }
};



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

            {/* Finance Dashboard Link - Only for finance department and chairman */}
            {hasFinanceAccess() && (
              <li>
                <Link
                  to="finance"
                  onClick={closeSidebar}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <PieChart className="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary" />
                  {(sidebarOpen || window.innerWidth < 1024) && (
                    <span className="ml-3">Finance Dashboard</span>
                  )}
                </Link>
              </li>
            )}

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

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-gray-600 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200 font-semibold text-gray-700">
                      Notifications
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => handleNotificationClick(note)}

                            className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition"
                          >
                            <p className="font-medium">{note.title}</p>
                            <p className="text-xs text-gray-500">{note.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                      )}
                    </div>
                  </div>
                )}

              </div>


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
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'transform rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
                    </div>

                    <div className="py-1">
                      {/* Settings link */}
                      <Link
                        to="settings/change-password"
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FiSettings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>

                      {/* Change Password link */}
                      {/* <Link
            to="/change-password"
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiKey className="h-4 w-4 mr-3" />
            Change Password
          </Link> */}

                      {/* Sign out */}
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
          <Outlet context={{ selectedMemoId, setSelectedMemoId, selectedRequisitionId,
    setSelectedRequisitionId }} />

        </main>
      </div>
    </div>
  )
}

export default DashboardLayout