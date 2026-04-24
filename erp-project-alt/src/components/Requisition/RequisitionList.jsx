import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import {
  ShoppingCart, MagnifyingGlass, Plus, X, CheckCircle,
  XCircle, Clock, ArrowDown, Paperclip, ChatCircle, FileText,
  CurrencyDollar,
} from '@phosphor-icons/react';

// ─── Comment Section ───────────────────────────────────────────────────────────
const CommentSection = ({ requisitionId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => { fetchComments(); }, [requisitionId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/requisitions/${requisitionId}/comments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setComments(res.data);
    } catch (e) { console.error('Failed to fetch comments:', e); }
  };

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/requisitions/${requisitionId}/comments`,
        { comment: newComment, user_id: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.status === 201) { setNewComment(''); setShowInput(false); fetchComments(); }
    } catch (e) { console.error('Failed to add comment:', e); alert('Failed to add comment. Please try again.'); }
    finally { setLoading(false); }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChatCircle size={16} weight="duotone" className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Comments</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{comments.length}</span>
        </div>
        <button onClick={() => setShowInput(!showInput)} className="text-xs font-medium text-[#1E5269] hover:underline">
          {showInput ? 'Cancel' : '+ Add comment'}
        </button>
      </div>

      {showInput && (
        <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Type your comment here..." rows="3"
            className="w-full bg-white text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E5269] resize-none" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowInput(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition">Cancel</button>
            <button onClick={handleAdd} disabled={loading || !newComment.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-[#1E5269] text-white rounded-lg disabled:opacity-40 transition">
              {loading ? 'Adding...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {comments.length > 0 ? comments.map(c => (
          <div key={c.id} className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">{c.user_name}</span>
              <span className="text-[10px] text-gray-400">{formatDate(c.created_at)}</span>
            </div>
            <p className="text-sm text-gray-600">{c.comment}</p>
          </div>
        )) : <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first to add one!</p>}
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FINANCE_TABS = { TO_BE_ACTED: 'to_be_acted', ACTED_UPON: 'acted_upon' };

const getMimeTypeFromFilename = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// File icon helper function
const getFileIcon = (file) => {
  const fileType = file.mimetype?.split('/')[0] || '';
  const originalName = file.originalname || file.filename || '';
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const iconClass = "h-8 w-8 text-gray-400";

  // PDF
  if (file.mimetype === 'application/pdf' || extension === 'pdf') {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Word
  if (file.mimetype?.includes('word') || ['doc', 'docx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Excel
  if (file.mimetype?.includes('excel') || ['xls', 'xlsx'].includes(extension)) {
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  // Image
  if (fileType === 'image') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
};

const StatusPill = ({ status }) => {
  const map = { approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-600', completed: 'bg-blue-50 text-blue-700', submitted: 'bg-violet-50 text-violet-700', pending: 'bg-amber-50 text-amber-700' };
  const s = status?.toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${map[s] || map.pending}`}>
      {s === 'submitted' ? 'Submitted' : s?.charAt(0).toUpperCase() + s?.slice(1)}
    </span>
  );
};

const PriorityPill = ({ priority }) => {
  const map = { high: 'bg-red-50 text-red-600', medium: 'bg-amber-50 text-amber-600', low: 'bg-green-50 text-green-700' };
  const p = priority?.toLowerCase() || 'medium';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${map[p]}`}>{p}</span>;
};

// ─── Main Component ────────────────────────────────────────────────────────────
const RequisitionList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { id, requisitionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [financeActionedRequisitions, setFinanceActionedRequisitions] = useState([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [showApprovalComment, setShowApprovalComment] = useState(false);
  const [showRejectionComment, setShowRejectionComment] = useState(false);

  useEffect(() => {
    axios.get(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => setUsers(r.data.reduce((a, u) => ({ ...a, [u.id]: u }), {})))
      .catch(console.error);
  }, [BASE_URL, user.token]);

  useEffect(() => {
    if (id && requisitions.length > 0) {
      const r = requisitions.find(r => r.id.toString() === id);
      if (r) setSelectedRequisition(r);
    }
  }, [id, requisitions]);

  useEffect(() => {
    if (requisitionId && requisitions.length > 0) {
      const r = requisitions.find(r => r.id == requisitionId);
      if (r) setSelectedRequisition(r);
    }
  }, [requisitionId, requisitions]);

  useEffect(() => {
    axios.get(`${BASE_URL}/requisitions/user/${user.id}?role=${user.role}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(r => {
      setRequisitions(r.data.map(req => ({
        ...req,
        requester: users[req.created_by]?.name || `User ${req.created_by}`,
        requesterDetails: users[req.created_by],
        date: new Date(req.created_at).toLocaleDateString(),
        status: req.status || 'submitted',
        priority: req.priority || 'medium',
      })));
    }).catch(e => setError(e.response?.data?.message || 'Failed to fetch requisitions'))
      .finally(() => setLoading(false));
  }, [user, users]);

  const searchFiltered = requisitions.filter(req =>
    (req.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof req.requester === 'string' && req.requester.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (req.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (req.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const isRejected = (req) => req.status?.toLowerCase() === 'rejected' ||
    ['manager', 'executive', 'finance', 'gmd', 'chairman'].some(r => req[`rejected_by_${r}`] === 1);
  const isCompleted = (req) => req.status?.toLowerCase() === 'completed';

  const isApproved = (req, role, userId) => {
    role = role?.toLowerCase();
    if (role === 'finance') return req.approved_by_finance === 1;
    if (role === 'gmd') return req.approved_by_gmd === 1;
    if (role === 'chairman') return req.approved_by_chairman === 1;
    if (role === 'manager') return req.approved_by_manager === 1;
    if (role === 'executive') return req.approved_by_executive === 1;
    if (req.created_by === userId) return req.approved_by_chairman === 1;
    return false;
  };

  const isPending = (req, role, userId) => {
    role = role?.toLowerCase();
    const dept = req.sender_department?.toLowerCase();
    if (isRejected(req) || isCompleted(req)) return false;
    if (req.created_by === userId) return req.approved_by_chairman !== 1;
    if (dept === 'ict') {
      if (role === 'manager') return !req.approved_by_manager && !req.rejected_by_manager;
      if (role === 'executive') return req.approved_by_manager && !req.approved_by_executive && !req.rejected_by_executive;
      if (role === 'finance') return req.approved_by_executive && !req.approved_by_finance && !req.rejected_by_finance;
      if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
      if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
    } else if (dept === 'finance') {
      if (role === 'finance') return !req.approved_by_finance && !req.rejected_by_finance;
      if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
      if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
    } else {
      if (role === 'finance') return !req.approved_by_finance && !req.rejected_by_finance;
      if (role === 'gmd') return req.approved_by_finance && !req.approved_by_gmd && !req.rejected_by_gmd;
      if (role === 'chairman') return req.approved_by_gmd && !req.approved_by_chairman && !req.rejected_by_chairman;
    }
    return false;
  };

  const getFinanceFiltered = (tab) => {
    const ca = searchFiltered.filter(r => r.approved_by_chairman === 1);
    return tab === FINANCE_TABS.TO_BE_ACTED ? ca.filter(r => r.paid_by_finance !== 1) : ca.filter(r => r.paid_by_finance === 1);
  };

  const getFiltered = () => {
    const role = user.role?.toLowerCase(), userId = user.id;
    if (role === 'finance' && [FINANCE_TABS.TO_BE_ACTED, FINANCE_TABS.ACTED_UPON].includes(activeTab))
      return getFinanceFiltered(activeTab);
    switch (activeTab) {
      case 'all':
        return searchFiltered;
      case 'pending':
        return searchFiltered.filter(r => isPending(r, role, userId));
      case 'approved':
        return searchFiltered.filter(r => isApproved(r, role, userId) && !isCompleted(r));
      case 'rejected':
        return searchFiltered.filter(r => isRejected(r));
      case 'completed':
        return searchFiltered.filter(r => isCompleted(r));
      default:
        return searchFiltered;
    }
  };

  const getCounts = () => {
    const role = user.role?.toLowerCase(), userId = user.id;
    const base = {
      all: searchFiltered.length,
      pending: searchFiltered.filter(r => isPending(r, role, userId)).length,
      approved: searchFiltered.filter(r => isApproved(r, role, userId) && !isCompleted(r)).length,
      rejected: searchFiltered.filter(r => isRejected(r)).length,
      completed: searchFiltered.filter(r => isCompleted(r)).length,
    };
    if (role === 'finance') {
      const ca = searchFiltered.filter(r => r.approved_by_chairman === 1);
      base[FINANCE_TABS.TO_BE_ACTED] = ca.filter(r => r.paid_by_finance !== 1).length;
      base[FINANCE_TABS.ACTED_UPON] = ca.filter(r => r.paid_by_finance === 1).length;
    }
    return base;
  };

  const handlePay = async (req) => {
    try {
      const res = await axios.post(`${BASE_URL}/requisitions/${req.id}/mark-paid`, { user_id: user.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.status === 200) {
        alert('Requisition marked as paid successfully!');
        const updated = { ...req, paid_by_finance: 1 };
        setRequisitions(prev => prev.map(r => r.id === req.id ? updated : r));
        setSelectedRequisition(updated);
      }
    } catch (e) { console.error('Payment failed:', e.response?.data || e.message); alert(`❌ Error: ${e.response?.data?.message || 'Payment failed'}`); }
  };

  const handleApprove = async (req) => {
    if (user.role.toLowerCase() !== 'chairman' && !approvalComment.trim()) { alert('Please add recommendations for approval'); return; }
    try {
      const res = await axios.post(`${BASE_URL}/requisitions/${req.id}/approve`, { user_id: user.id, role: user.role }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.status === 200) {
        if (approvalComment.trim()) {
          await axios.post(`${BASE_URL}/requisitions/${req.id}/comments`,
            { comment: user.role.toLowerCase() === 'chairman' ? `Chairman Approval: ${approvalComment}` : `Recommendation: ${approvalComment}`, user_id: user.id },
            { headers: { Authorization: `Bearer ${user.token}` } });
        }
        alert(`✅ Success: ${res.data.message}`);
        const updated = { ...req, ...res.data.updatedFields, [`approved_by_${user.role}`]: 1, [`rejected_by_${user.role}`]: 0 };
        setRequisitions(prev => prev.map(r => r.id === req.id ? updated : r));
        setSelectedRequisition(null);
        setApprovalComment('');
        setShowApprovalComment(false);
        if (res.data.nextApprover) { alert(`Next approver: ${res.data.nextApprover}`); }
      }
    } catch (e) { console.error('Approval failed:', e.response?.data || e.message); alert(`❌ Error: ${e.response?.data?.message || 'Approval failed'}`); }
  };

  const handleReject = async (req) => {
    if (user.role.toLowerCase() !== 'chairman' && !rejectionComment.trim()) { alert('Please add remarks for rejection'); return; }
    try {
      const res = await axios.post(`${BASE_URL}/requisitions/${req.id}/reject`, { userId: user.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.data?.success) {
        if (rejectionComment.trim()) {
          await axios.post(`${BASE_URL}/requisitions/${req.id}/comments`,
            { comment: user.role.toLowerCase() === 'chairman' ? `Chairman Rejection: ${rejectionComment}` : `Rejection Remark: ${rejectionComment}`, user_id: user.id },
            { headers: { Authorization: `Bearer ${user.token}` } });
        }
        const { field } = res.data;
        setRequisitions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', [field]: -1 } : r));
        setSelectedRequisition(null);
        setRejectionComment('');
        setShowRejectionComment(false);
        setError(null);
      }
    } catch (e) { setError(e.response?.data?.message || 'Failed to reject requisition'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#1E5269] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">{error}</div>;

  const counts = getCounts();
  const filtered = getFiltered();

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    ...(user.role?.toLowerCase() === 'finance' ? [
      { key: FINANCE_TABS.TO_BE_ACTED, label: 'To be Acted Upon' },
      { key: FINANCE_TABS.ACTED_UPON, label: 'Acted Upon' },
    ] : []),
    { key: 'rejected', label: 'Rejected' },
    // { key: 'completed', label: 'Completed' }, // Commented out as in original
  ];

  return (
    <div className="flex gap-5" style={{ fontFamily: "'DM Sans', sans-serif", minHeight: 'calc(100vh - 96px)' }}>

      {/* ── List Panel ── */}
      <div className={`${selectedRequisition ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] shrink-0`}>
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ minHeight: 'calc(100vh - 96px)' }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} weight="duotone" className="text-[#1E5269]" />
                <h2 className="text-sm font-bold text-gray-800">Requisitions</h2>
              </div>
              <Link to="/dashboard/requisitions/new"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E5269] text-white text-xs font-medium rounded-xl hover:bg-[#1E5269]/90 transition">
                <Plus size={13} weight="bold" /> New Requisition
              </Link>
            </div>

            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search requisitions..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1E5269]" />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === t.key ? 'bg-[#1E5269] text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                {t.label}
                <span className={`ml-1.5 text-[10px] ${activeTab === t.key ? 'opacity-70' : 'opacity-50'}`}>{counts[t.key] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 pt-1">
            {filtered.length > 0 ? filtered.map(req => (
              <button key={req.id}
                onClick={() => {
                  if (selectedRequisition?.id === req.id) {
                    setSelectedRequisition(null);
                    navigate('/dashboard/requisitions');
                  } else {
                    setSelectedRequisition(req);
                    navigate(`/dashboard/requisitions/${req.id}`);
                  }
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all
                  ${selectedRequisition?.id === req.id ? 'bg-[#1E5269]/5 border-[#1E5269]/20' : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate leading-tight">{req.title}</p>
                  <StatusPill status={req.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 truncate">
                  From: {req.requester}{req.requesterDetails?.department && ` (${req.requesterDetails.department})`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <PriorityPill priority={req.priority} />
                  <div className="flex items-center gap-2">
                    {req.total_amount > 0 && (
                      <span className="text-xs font-semibold text-gray-600">₦{req.total_amount.toLocaleString()}</span>
                    )}
                    <span className="text-[10px] text-gray-400">{req.date}</span>
                  </div>
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart size={28} weight="duotone" className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No {activeTab} requisitions found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selectedRequisition && (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 96px)' }}>

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-800 mb-1">{selectedRequisition.title}</h2>
                <p className="text-xs text-gray-400">
                  From: <span className="text-gray-600 font-medium">{selectedRequisition.requester}</span>
                  {selectedRequisition.requesterDetails?.department && ` (${selectedRequisition.requesterDetails.department})`}
                  <span className="mx-2 text-gray-200">|</span>
                  Date: {selectedRequisition.date}
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <StatusPill status={selectedRequisition.status} />
                  <PriorityPill priority={selectedRequisition.priority} />
                </div>
              </div>
              <button onClick={() => { setSelectedRequisition(null); navigate('/dashboard/requisitions'); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition shrink-0">
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Description */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50/60 rounded-xl p-4 border border-gray-100 leading-relaxed">
                  {selectedRequisition.description}
                </p>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Item</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Quantity</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedRequisition.items?.length > 0 ? selectedRequisition.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition">
                          <td className="px-4 py-3 text-gray-800">{item.name || 'Unnamed Item'}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-500">₦{item.unit_price?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-700">₦{(item.quantity * item.unit_price)?.toLocaleString()}</td>
                         </tr>
                      )) : (
                        <tr><td colSpan="4" className="px-4 py-6 text-center text-xs text-gray-400">No items added to this requisition</td></tr>
                      )}
                      {selectedRequisition.items?.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Total</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-[#1E5269]">₦{selectedRequisition.total_amount?.toLocaleString()}</td>
                         </tr>
                      )}
                    </tbody>
                   </table>
                </div>
              </div>

              {/* Attachments */}
              {selectedRequisition.attachments && (() => {
                try {
                  const files = JSON.parse(selectedRequisition.attachments);
                  if (!files?.length) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Paperclip size={14} weight="duotone" className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600">Attachments ({files.length})</span>
                      </div>
                      <div className="space-y-2">
                        {files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                {getFileIcon({
                                  mimetype: file.mimetype,
                                  originalname: file.originalname || file.filename
                                })}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">{file.originalname || file.filename}</p>
                                <div className="flex items-center text-[10px] text-gray-400">
                                  <span>{file.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                  {file.size > 0 && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span>{formatFileSize(file.size)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <a href={`${BASE_URL}/uploads/${file.filename}`}
                              download={file.originalname || file.filename} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1E5269] hover:bg-white transition">
                              <ArrowDown size={14} weight="bold" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error parsing attachments:', error);
                  return <p className="text-sm text-red-500">Error loading attachments</p>;
                }
              })()}

              {/* Approval Pipeline */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Approval Pipeline</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { role: 'manager', label: 'Manager' },
                    { role: 'executive', label: 'Executive' },
                    { role: 'finance', label: 'Finance' },
                    { role: 'gmd', label: 'GMD' },
                    { role: 'chairman', label: 'Chairman' }
                  ].map(({ role, label }) => {
                    const approved = selectedRequisition[`approved_by_${role}`] === 1;
                    const rejected = selectedRequisition[`rejected_by_${role}`] === 1;
                    return (
                      <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                        approved ? 'bg-green-50 border-green-100 text-green-700' :
                        rejected ? 'bg-red-50 border-red-100 text-red-600' :
                        'bg-gray-50 border-gray-100 text-gray-400'
                      }`}>
                        {approved ? <CheckCircle size={12} weight="fill" /> : rejected ? <XCircle size={12} weight="fill" /> : <Clock size={12} weight="duotone" />}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pay (Finance) */}
              {user.role?.toLowerCase() === 'finance' && activeTab === FINANCE_TABS.TO_BE_ACTED && selectedRequisition.paid_by_finance !== 1 && (
                <div className="mb-4">
                  <button onClick={() => handlePay(selectedRequisition)}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition">
                    <CurrencyDollar size={16} weight="bold" /> Mark as Paid
                  </button>
                </div>
              )}

              {/* Approve/Reject */}
              {(() => {
                const userRole = user?.role?.toLowerCase();
                const approved = selectedRequisition[`approved_by_${userRole}`] === 1;
                const rejected = selectedRequisition[`rejected_by_${userRole}`] === 1;
                const acted = approved || rejected;
                const isFullyApproved = selectedRequisition.approved_by_finance === 1 && selectedRequisition.approved_by_gmd === 1 && selectedRequisition.approved_by_chairman === 1;
                const isAuthorized = ['manager', 'executive', 'finance', 'gmd', 'chairman'].includes(userRole);
                const statusOk = ['pending', 'submitted'].includes(selectedRequisition.status);
                const canAct = !acted && statusOk && !isFullyApproved;
                if (!isAuthorized || !canAct) return null;

                return (
                  <div className="space-y-3">
                    {showApprovalComment && userRole !== 'chairman' && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-800 mb-2">Recommendation</p>
                        <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)}
                          placeholder="Enter your recommendations for approval..." rows="3"
                          className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white" />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => { setShowApprovalComment(false); setApprovalComment(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-white rounded-lg transition">Cancel</button>
                          <button onClick={() => handleApprove(selectedRequisition)} disabled={!approvalComment.trim()}
                            className="px-4 py-1.5 text-xs font-medium bg-[#1E5269] text-white rounded-lg disabled:opacity-40">Submit Approval</button>
                        </div>
                      </div>
                    )}
                    {showRejectionComment && userRole !== 'chairman' && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs font-semibold text-red-800 mb-2">Rejection Remark</p>
                        <textarea value={rejectionComment} onChange={e => setRejectionComment(e.target.value)}
                          placeholder="Enter your remarks for rejection..." rows="3"
                          className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 resize-none bg-white" />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => { setShowRejectionComment(false); setRejectionComment(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-white rounded-lg transition">Cancel</button>
                          <button onClick={() => handleReject(selectedRequisition)} disabled={!rejectionComment.trim()}
                            className="px-4 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg disabled:opacity-40">Submit Rejection</button>
                        </div>
                      </div>
                    )}
                    {!showApprovalComment && !showRejectionComment && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => userRole === 'chairman' ? handleReject(selectedRequisition) : (setShowRejectionComment(true), setShowApprovalComment(false))}
                          className="px-5 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition">
                          Reject
                        </button>
                        <button
                          onClick={() => userRole === 'chairman' ? handleApprove(selectedRequisition) : (setShowApprovalComment(true), setShowRejectionComment(false))}
                          className="px-5 py-2 text-sm font-medium bg-[#1E5269] text-white rounded-xl hover:bg-[#1E5269]/90 transition">
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Comments */}
              <CommentSection requisitionId={selectedRequisition.id} user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionList;