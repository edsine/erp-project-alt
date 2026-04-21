import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContext";
import axios from 'axios';
import {
  FileText,
  ShoppingCart,
  CheckSquare,
  CalendarBlank,
  Plus,
  Clock,
  ArrowRight,
  PresentationChart,
  EnvelopeSimple,
  ArrowUpRight,
  Sparkle,
} from '@phosphor-icons/react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, accent, link }) => (
  <Link
    to={link}
    className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#1E5269]/20 hover:shadow-[0_8px_32px_rgba(30,82,105,0.08)] transition-all duration-300 overflow-hidden"
  >
    {/* Subtle ambient glow */}
    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${accent}`} />

    <div className="flex items-start justify-between relative">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">{title}</p>
        <p className="text-3xl font-light text-gray-800 tabular-nums">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#1E5269] group-hover:bg-[#1E5269]/8 transition-all">
        <Icon size={20} weight="duotone" />
      </div>
    </div>

    <div className="flex items-center gap-1 mt-6 text-xs text-gray-400 group-hover:text-[#1E5269] transition-colors">
      <span>View all</span>
      <ArrowRight size={12} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
    </div>
  </Link>
);

// ─── Quick Action Card ─────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, title, description, link }) => (
  <Link
    to={link}
    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#1E5269]/20 hover:bg-[#1E5269]/3 transition-all duration-200"
  >
    <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-[#1E5269]/10 flex items-center justify-center text-gray-400 group-hover:text-[#1E5269] transition-all shrink-0">
      <Icon size={18} weight="duotone" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-700 group-hover:text-[#1E5269] transition-colors">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
    </div>
    <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#1E5269] transition-colors shrink-0" />
  </Link>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoCount, setMemoCount] = useState(0);
  const [requisitionCount, setRequisitionCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [directMemoCount, setDirectMemoCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const hasFinanceAccess = () => {
    if (!user) return false;
    return (
      user.role?.toLowerCase() === 'finance' ||
      user.role?.toLowerCase() === 'chairman' ||
      user.department?.toLowerCase() === 'finance'
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        await Promise.allSettled([
          fetch(`${BASE_URL}/tasks/counts/user/${user.id}`).then(r => r.json()).then(d => d.success && setTaskCount(d.count)),
          fetch(`${BASE_URL}/direct-memos/count/user/${user.id}`).then(r => r.json()).then(d => setDirectMemoCount(d.count || 0)),
          fetch(`${BASE_URL}/requisitions/count/user/${user.id}?role=${user.role}`).then(r => r.json()).then(d => d.success && setRequisitionCount(d.count || 0)),
          fetch(`${BASE_URL}/memos/counts/${user.id}`).then(r => r.json()).then(d => setMemoCount(d.count || 0)),
          fetch(`${BASE_URL}/leave-requests/count/user/${user.id}`).then(r => r.json()).then(d => d.success && setLeaveCount(d.count || 0)),
        ]);
        try {
          const act = await axios.get(`${BASE_URL}/api/activities/recent`);
          setRecentActivities(Array.isArray(act.data) ? act.data : []);
        } catch (_) { setRecentActivities([]); }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [user, BASE_URL]);

  const getFirstName = () => user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { icon: FileText, title: 'Memos', value: memoCount, accent: 'bg-blue-400', link: '/dashboard/memos' },
    { icon: EnvelopeSimple, title: 'Task Reports', value: directMemoCount, accent: 'bg-cyan-400', link: '/dashboard/direct-memos' },
    { icon: ShoppingCart, title: 'Requisitions', value: requisitionCount, accent: 'bg-emerald-400', link: '/dashboard/requisitions' },
    { icon: CheckSquare, title: 'Tasks', value: taskCount, accent: 'bg-amber-400', link: '/dashboard/tasks' },
    { icon: CalendarBlank, title: 'Leaves', value: leaveCount, accent: 'bg-violet-400', link: '/dashboard/leaves' },
    ...(hasFinanceAccess() ? [{ icon: PresentationChart, title: 'Finance', value: '→', accent: 'bg-teal-400', link: '/dashboard/finance' }] : []),
  ];

  const filteredActivities = recentActivities.filter(a => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-gray-100" />
          <div className="h-80 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Greeting ── */}
<div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/2 to-transparent rounded-3xl p-8 border border-primary/10 flex items-center justify-between">
  
  {/* LEFT CONTENT */}
  <div className="relative z-10">
    <p className="text-sm text-gray-400 mb-1">{greeting},</p>
    
    <h1 className="text-4xl font-semibold text-primary leading-tight">
      {getFirstName()} <span className="text-[#1E5269]"></span>
    </h1>
    
    <p className="text-gray-500 mt-2 text-sm">
      Here's what's happening with your workspace today.
    </p>
  </div>

  {/* RIGHT CONTENT */}
  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 relative z-10">
    <Sparkle size={14} weight="duotone" className="text-[#1E5269]" />
    <span>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}
    </span>
  </div>

  {/* BACKGROUND DECOR */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
</div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Activities</h2>
            <div className="flex gap-1">
              {['all', 'pending', 'completed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs rounded-lg capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-[#1E5269] text-white'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
            {filteredActivities.length > 0 ? filteredActivities.map(activity => (
              <div key={activity.id} className="px-6 py-3.5 hover:bg-gray-50/50 transition group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-[#1E5269]/8 flex items-center justify-center transition">
                      <FileText size={14} weight="duotone" className="text-gray-400 group-hover:text-[#1E5269] transition" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{activity.title || activity.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    activity.status === 'completed'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={28} weight="duotone" className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">No activities yet</p>
                <p className="text-xs text-gray-300 mt-1">Your activity history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction
              icon={Plus}
              title="New Memo"
              description="Send a memo to your team"
              link="/dashboard/memos/new"
            />
            <QuickAction
              icon={ShoppingCart}
              title="New Requisition"
              description="Request items or services"
              link="/dashboard/requisitions/new"
            />
            <QuickAction
              icon={CalendarBlank}
              title="Request Leave"
              description="Submit a leave application"
              link="/dashboard/leaves/new"
            />
          </div>

          {/* Subtle separator */}
          <div className="my-4 border-t border-gray-50" />
          <p className="text-[10px] text-gray-300 uppercase tracking-widest font-medium px-1">Workspace</p>
          <div className="mt-2 space-y-2">
            <QuickAction
              icon={FileText}
              title="View All Memos"
              description="Browse your memo history"
              link="/dashboard/memos"
            />
            <QuickAction
              icon={CheckSquare}
              title="My Tasks"
              description="Check pending tasks"
              link="/dashboard/tasks"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;