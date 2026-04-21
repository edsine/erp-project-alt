import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import logo from '../assets/pgl_logo.png'

// Inject Playfair Display font for PY-SPACE branding
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector('[href*="Playfair+Display"]')) {
  document.head.appendChild(fontLink);
}

// Phosphor Icons (install: npm i @phosphor-icons/react)
import {
  House,
  FileText,
  ShoppingCart,
  CalendarBlank,
  Folder,
  Users,
  CheckSquare,
  CurrencyDollar,
  List,
  X,
  Bell,
  CaretDown,
  SignOut,
  Gear,
  PresentationChart,
  ArrowLeft,
  ArrowRight,
  EnvelopeSimple,
} from '@phosphor-icons/react'

const DashboardLayout = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationSound = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const sound = new Audio("/sounds/Notification.m4a");
    sound.volume = 0.6;
    notificationSound.current = sound;
    const enableAudio = () => {
      sound.play().then(() => sound.pause());
      document.removeEventListener("click", enableAudio);
    };
    document.addEventListener("click", enableAudio);
    return () => document.removeEventListener("click", enableAudio);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const seenNotifications = new Set();
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${BASE_URL}/notifications/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        const newUnread = data.filter(n => !n.is_read && !seenNotifications.has(n.id));
        if (newUnread.length > 0 && notificationSound.current) {
          notificationSound.current.currentTime = 0;
          notificationSound.current.play().catch(() => {});
        }
        data.forEach(n => seenNotifications.add(n.id));
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1E5269] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 tracking-wide">Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  const hasFinanceAccess = () =>
    user && (user.role === 'finance' || user.role === 'chairman' || user.department === 'finance' || user.role === 'admin');

  const handleNotificationClick = async (note) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== note.id));
      setUnreadCount(count => Math.max(count - 1, 0));
      setShowNotifications(false);
      fetch(`${BASE_URL}/notifications-mark-read/${note.id}`, { method: "PUT" }).catch(() => {});
      if (note.link) {
        if (note.link.includes("/memos/")) {
          const m = note.link.match(/\/memos\/(\d+)/);
          if (m) { setSelectedMemoId(parseInt(m[1])); navigate(`/dashboard/memos/${m[1]}`); return; }
        }
        if (note.link.includes("/requisitions/")) {
          const m = note.link.match(/\/requisitions\/(\d+)/);
          if (m) { navigate(`/dashboard/requisitions/${m[1]}`); return; }
        }
        navigate(note.link);
      }
    } catch (err) { console.error(err); }
  };

  const navItems = [
    { icon: House, label: 'Dashboard', to: '' },
    { icon: FileText, label: 'Memos', to: 'memos' },
    { icon: EnvelopeSimple, label: 'Task Reports', to: 'direct-memos' },
    { icon: ShoppingCart, label: 'Requisitions', to: 'requisitions' },
    ...(user.role === 'staff' ? [
      { icon: CheckSquare, label: 'Tasks', to: 'tasks' },
      { icon: Users, label: 'Users', to: 'users' },
    ] : []),
    { icon: CalendarBlank, label: 'Leaves', to: 'leaves' },
    { icon: Folder, label: 'Files', to: 'files' },
    ...(hasFinanceAccess() ? [{ icon: PresentationChart, label: 'Finance', to: 'finance' }] : []),
    ...(user.role === 'finance' ? [{ icon: CurrencyDollar, label: 'Payroll', to: 'payroll' }] : []),
  ];

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#f0f0ed] flex overflow-hidden" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Floating Sidebar ── */}
      <aside className={`
        fixed top-4 left-4 bottom-4 z-30
        bg-white/95 backdrop-blur-xl
        rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)]
        border border-white/60
        flex flex-col
        transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0 w-56' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'}
        ${sidebarOpen ? 'w-56' : 'lg:w-[68px] w-56'}
      `}>

        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100/80">
          {/* PY-SPACE with Playfair Display font */}
          <span
            className={`tracking-tight text-[#1E5269] text-lg transition-all duration-200 overflow-hidden whitespace-nowrap
              ${sidebarOpen ? 'opacity-100 max-w-[120px]' : 'lg:opacity-0 lg:max-w-0 opacity-100 max-w-[120px]'}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em' }}
          >
            PY-SPACE
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#1E5269] hover:bg-gray-50 transition-all"
          >
            {sidebarOpen
              ? <ArrowLeft size={16} weight="bold" />
              : <ArrowRight size={16} weight="bold" className="lg:block hidden" />
            }
            <X size={16} weight="bold" className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ icon: Icon, label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-[#1E5269] hover:bg-[#1E5269]/5 transition-all duration-150"
            >
              <Icon size={20} weight="duotone" className="shrink-0 group-hover:scale-105 transition-transform" />
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 overflow-hidden
                ${sidebarOpen ? 'opacity-100 max-w-[150px]' : 'lg:opacity-0 lg:max-w-0 opacity-100 max-w-[150px]'}`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        {/* <div className="px-3 py-4 border-t border-gray-100/80">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/80 ${!sidebarOpen ? 'lg:justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-lg bg-[#1E5269] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${sidebarOpen ? 'opacity-100 max-w-[150px]' : 'lg:opacity-0 lg:max-w-0 opacity-100 max-w-[150px]'}`}>
              <p className="text-xs font-semibold text-gray-700 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div> */}
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${sidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-[84px]'}
        ml-0
      `}>

        {/* ── Floating Navbar ── */}
        <header className="sticky top-0 z-20 px-4 pt-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-white/70 px-5 py-3 flex items-center justify-between">

            {/* Left side: Mobile burger + Logo + Brand */}
            <div className="flex items-center gap-3">
              {/* Mobile burger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition"
              >
                <List size={20} weight="bold" />
              </button>

              {/* Logo + Brand name — visible on all screen sizes */}
              <div className="flex items-center gap-2.5">
                <img
                  src={logo}
                  alt="PGL Logo"
                  className="h-8 w-auto object-contain"
                />
                <span
                  className="text-[#1E5269] text-lg hidden sm:block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em' }}
                >
                  PY-SPACE
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#1E5269] hover:bg-gray-50 transition"
                >
                  <Bell size={19} weight="duotone" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-50 text-red-500 font-medium px-2 py-0.5 rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(note => (
                        <div
                          key={note.id}
                          onClick={() => handleNotificationClick(note)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition ${!note.is_read ? 'bg-blue-50/40' : ''}`}
                        >
                          <p className="text-sm font-medium text-gray-800">{note.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{note.message}</p>
                        </div>
                      )) : (
                        <p className="px-4 py-8 text-sm text-gray-400 text-center">You're all caught up ✓</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1E5269] flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
                  </div>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={`text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="settings/change-password"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-[#1E5269] hover:bg-gray-50 transition"
                      >
                        <Gear size={15} weight="duotone" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50/50 transition"
                      >
                        <SignOut size={15} weight="duotone" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-4 pb-8 overflow-y-auto">
          <Outlet context={{ selectedMemoId, setSelectedMemoId, selectedRequisitionId, setSelectedRequisitionId }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;