import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, MagnifyingGlass, Plus, X, CheckCircle,
  XCircle, Clock, ArrowDown, Paperclip, ChatCircle,
  CaretLeft, CheckSquare, Trash,
} from '@phosphor-icons/react';

// ─── Comment Section ───────────────────────────────────────────────────────────
const CommentSection = ({ memoId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => { fetchComments(); }, [memoId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/memos/${memoId}/comments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setComments(res.data);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/memos/${memoId}/comments`,
        { comment: newComment, user_id: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res.status === 201) { setNewComment(''); setShowInput(false); fetchComments(); }
    } catch (e) { alert('Failed to add comment.'); }
    finally { setLoading(false); }
  };

  const fmt = (d) => new Date(d).toLocaleString();

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChatCircle size={16} weight="duotone" className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Comments</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{comments.length}</span>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-xs font-medium text-[#1E5269] hover:underline"
        >
          {showInput ? 'Cancel' : '+ Add comment'}
        </button>
      </div>

      {showInput && (
        <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            className="w-full bg-white text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E5269] resize-none"
            rows="3"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowInput(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={loading || !newComment.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-[#1E5269] text-white rounded-lg disabled:opacity-40 transition"
            >
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {comments.length > 0 ? comments.map(c => (
          <div key={c.id} className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">{c.user_name}</span>
              <span className="text-[10px] text-gray-400">{fmt(c.created_at)}</span>
            </div>
            <p className="text-sm text-gray-600">{c.comment}</p>
          </div>
        )) : (
          <p className="text-xs text-gray-400 text-center py-4">No comments yet</p>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FINANCE_TABS = { TO_BE_ACTED: 'to_be_acted', ACTED_UPON: 'acted_upon' };

const formatFileSize = (b) => {
  if (!b) return '';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

const StatusPill = ({ status }) => {
  const map = {
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-600',
    completed: 'bg-blue-50 text-blue-700',
    submitted: 'bg-violet-50 text-violet-700',
    pending: 'bg-amber-50 text-amber-700',
  };
  const s = status?.toLowerCase();
  const label = s === 'submitted' ? 'Submitted' : s?.charAt(0).toUpperCase() + s?.slice(1);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${map[s] || map.pending}`}>
      {label}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MemoList = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { memoId } = useParams();

  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [financeActionedMemos, setFinanceActionedMemos] = useState([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [showApprovalComment, setShowApprovalComment] = useState(false);
  const [showRejectionComment, setShowRejectionComment] = useState(false);

  useEffect(() => {
    axios.get(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => setUsers(r.data.reduce((a, u) => ({ ...a, [u.id]: u }), {})))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios.get(`${BASE_URL}/memos/user/${user.id}?role=${user.role}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(r => {
      const transformed = r.data.map(m => ({
        ...m,
        sender: users[m.created_by]?.name || `User ${m.created_by}`,
        senderDetails: users[m.created_by],
        isSender: m.created_by === user.id,
        date: new Date(m.created_at).toLocaleDateString(),
        status: m.status || 'submitted',
        priority: m.priority || 'medium',
        acknowledged: isMemoAcknowledgedByUser(m, user.id),
        paid_by_finance: m.paid_by_finance === 1,
      }));
      setMemos(transformed);
      setFinanceActionedMemos(transformed.filter(m => m.paid_by_finance).map(m => m.id));
    }).catch(e => setError(e.response?.data?.message || 'Failed to fetch memos'))
      .finally(() => setLoading(false));
  }, [user, users]);

  useEffect(() => {
    if (memoId && memos.length > 0) {
      const m = memos.find(m => m.id === parseInt(memoId));
      if (m) setSelectedMemo(m);
    }
  }, [memoId, memos]);

  const isMemoAcknowledgedByUser = (memo, userId) => {
    if (!memo.acknowledgments) return false;
    return (Array.isArray(memo.acknowledgments) ? memo.acknowledgments : [])
      .some(a => typeof a === 'object' && a.id === userId);
  };

  const isMemoApproved = (memo) => {
    if (memo.created_by === user.id) return memo.approved_by_chairman === 1 && financeActionedMemos.includes(memo.id);
    const roleField = `approved_by_${user.role}`;
    return memo[roleField] === 1 || memo.approved_by_chairman === 1;
  };

  const isMemoRejected = (memo) => memo.status?.toLowerCase() === 'rejected' ||
    ['chairman', 'gmd', 'finance', 'executive', 'manager'].some(r => memo[`rejected_by_${r}`] === 1);

  const isMemoCompleted = (memo) => memo.status?.toLowerCase() === 'completed';

  const searchFiltered = memos.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFinanceFiltered = (tab) => {
    const ca = searchFiltered.filter(m => m.approved_by_chairman === 1);
    return tab === FINANCE_TABS.TO_BE_ACTED
      ? ca.filter(m => !financeActionedMemos.includes(m.id))
      : ca.filter(m => financeActionedMemos.includes(m.id));
  };

  const getFiltered = () => {
    if (user.role?.toLowerCase() === 'finance' && [FINANCE_TABS.TO_BE_ACTED, FINANCE_TABS.ACTED_UPON].includes(activeTab))
      return getFinanceFiltered(activeTab);
    switch (activeTab) {
      case 'pending': return searchFiltered.filter(m => {
        if (m.created_by === user.id) return !isMemoApproved(m) && !isMemoRejected(m) && !isMemoCompleted(m);
        return m[`approved_by_${user.role}`] !== 1 && m[`rejected_by_${user.role}`] !== 1 && !isMemoCompleted(m);
      });
      case 'approved': return searchFiltered.filter(m => isMemoApproved(m) && !isMemoCompleted(m));
      case 'rejected': return searchFiltered.filter(m => isMemoRejected(m) && !isMemoCompleted(m));
      case 'completed': return searchFiltered.filter(m => isMemoCompleted(m));
      default: return searchFiltered;
    }
  };

  const getCounts = () => {
    const base = {
      pending: searchFiltered.filter(m => {
        if (m.created_by === user.id) return !isMemoApproved(m) && !isMemoRejected(m) && !isMemoCompleted(m);
        return m[`approved_by_${user.role}`] !== 1 && m[`rejected_by_${user.role}`] !== 1 && !isMemoCompleted(m);
      }).length,
      approved: searchFiltered.filter(m => isMemoApproved(m) && !isMemoCompleted(m)).length,
      rejected: searchFiltered.filter(m => isMemoRejected(m) && !isMemoCompleted(m)).length,
      completed: searchFiltered.filter(m => isMemoCompleted(m)).length,
    };
    if (user.role?.toLowerCase() === 'finance') {
      const ca = searchFiltered.filter(m => m.approved_by_chairman === 1);
      base[FINANCE_TABS.TO_BE_ACTED] = ca.filter(m => !financeActionedMemos.includes(m.id)).length;
      base[FINANCE_TABS.ACTED_UPON] = ca.filter(m => financeActionedMemos.includes(m.id)).length;
    }
    return base;
  };

  const counts = getCounts();
  const filtered = getFiltered();

  const handleMemoClick = (memo) => {
    if (selectedMemo?.id === memo.id) { setSelectedMemo(null); navigate('/dashboard/memos'); }
    else { setSelectedMemo({ ...memo, acknowledged: isMemoAcknowledgedByUser(memo, user.id) }); navigate(`/dashboard/memos/${memo.id}`); }
  };

  const handlePay = async (memo) => {
    try {
      const res = await axios.post(`${BASE_URL}/memos/${memo.id}/pay`, { user_id: user.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.status === 200) {
        setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, paid_by_finance: 1, status: 'completed' } : m));
        setFinanceActionedMemos(prev => [...prev, memo.id]);
        setSelectedMemo(null);
      }
    } catch (e) { alert(`Error: ${e.response?.data?.message || 'Payment failed'}`); }
  };

  const handleApprove = async (memo) => {
    if (user.role.toLowerCase() !== 'chairman' && !approvalComment.trim()) { alert('Please add recommendations'); return; }
    try {
      const res = await axios.post(`${BASE_URL}/memos/${memo.id}/approve`, { user_id: user.id, role: user.role }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.status === 200) {
        if (approvalComment.trim()) await axios.post(`${BASE_URL}/memos/${memo.id}/comments`,
          { comment: user.role.toLowerCase() === 'chairman' ? `Chairman Approval: ${approvalComment}` : `Recommendation: ${approvalComment}`, user_id: user.id },
          { headers: { Authorization: `Bearer ${user.token}` } });
        setMemos(prev => prev.map(m => Number(m.id) === Number(memo.id) ? { ...m, ...res.data.updatedFields, [`approved_by_${user.role}`]: 1 } : m));
        setSelectedMemo(null); setApprovalComment(''); setShowApprovalComment(false);
      }
    } catch (e) { alert(`Error: ${e.response?.data?.message || 'Approval failed'}`); }
  };

  const handleReject = async (memo) => {
    if (user.role.toLowerCase() !== 'chairman' && !rejectionComment.trim()) { alert('Please add remarks'); return; }
    try {
      const res = await axios.post(`${BASE_URL}/memos/${memo.id}/reject`, { userId: user.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.data?.success) {
        if (rejectionComment.trim()) await axios.post(`${BASE_URL}/memos/${memo.id}/comments`,
          { comment: user.role.toLowerCase() === 'chairman' ? `Chairman Rejection: ${rejectionComment}` : `Rejection Remark: ${rejectionComment}`, user_id: user.id },
          { headers: { Authorization: `Bearer ${user.token}` } });
        const { field } = res.data;
        setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, status: 'rejected', [field]: 1 } : m));
        setSelectedMemo(null); setRejectionComment(''); setShowRejectionComment(false);
      }
    } catch (e) { setError(e.response?.data?.message || 'Failed to reject'); }
  };

  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm('Delete this memo?')) return;
    try {
      await axios.delete(`${BASE_URL}/memos/${memoId}`, { headers: { Authorization: `Bearer ${user.token}` } });
      setMemos(prev => prev.filter(m => m.id !== memoId));
      setSelectedMemo(null);
    } catch (e) { alert(`Error: ${e.response?.data?.message || 'Delete failed'}`); }
  };

  const handleAcknowledge = async (memo) => {
    try {
      const res = await axios.post(`${BASE_URL}/memos/${memo.id}/acknowledge`, { user_id: user.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.status === 200) {
        let acks = res.data.acknowledgments;
        if (typeof acks === 'string') { try { acks = JSON.parse(acks); } catch { acks = []; } }
        acks = acks.map(a => typeof a === 'object' && a.id ? { ...a, name: users[a.id]?.name || `User ${a.id}` } : a);
        const updated = { ...memo, acknowledged: true, acknowledgments: acks };
        setSelectedMemo(updated);
        setMemos(prev => prev.map(m => m.id === memo.id ? updated : m));
      }
    } catch (e) { alert(`Error: ${e.response?.data?.message || 'Failed'}`); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#1E5269] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">{error}</div>;

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    ...(user.role?.toLowerCase() === 'finance' ? [
      { key: FINANCE_TABS.TO_BE_ACTED, label: 'To Act' },
      { key: FINANCE_TABS.ACTED_UPON, label: 'Acted' },
    ] : []),
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex gap-5" style={{ fontFamily: "'DM Sans', sans-serif", minHeight: 'calc(100vh - 96px)' }}>

      {/* ── List Panel ── */}
      <div className={`${selectedMemo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] shrink-0`}>
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ minHeight: 'calc(100vh - 96px)' }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} weight="duotone" className="text-[#1E5269]" />
                <h2 className="text-sm font-bold text-gray-800">Memos</h2>
              </div>
              {user.role !== 'gmd' && user.role !== 'chairman' && (
                <Link to="/dashboard/memos/new"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E5269] text-white text-xs font-medium rounded-xl hover:bg-[#1E5269]/90 transition">
                  <Plus size={13} weight="bold" /> New Memo
                </Link>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search memos…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1E5269]"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === t.key ? 'bg-[#1E5269] text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                {t.label}
                <span className={`ml-1.5 text-[10px] ${activeTab === t.key ? 'opacity-70' : 'opacity-50'}`}>
                  {counts[t.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 pt-1">
            {filtered.length > 0 ? filtered.map(memo => (
              <button key={memo.id} onClick={() => handleMemoClick(memo)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all group
                  ${selectedMemo?.id === memo.id
                    ? 'bg-[#1E5269]/5 border-[#1E5269]/20'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate leading-tight">{memo.title}</p>
                  <StatusPill status={memo.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 truncate">
                  {memo.sender}{memo.senderDetails?.department && ` · ${memo.senderDetails.department}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${memo.memo_type === 'report' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {memo.memo_type === 'report' ? 'Report' : 'Memo'}
                  </span>
                  <span className="text-[10px] text-gray-400">{memo.date}</span>
                </div>
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={28} weight="duotone" className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No {activeTab} memos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selectedMemo && (
        <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 96px)' }}>

            {/* Detail Header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-bold text-gray-800">{selectedMemo.title}</h2>
                  {selectedMemo.memo_type === 'report' && selectedMemo.acknowledged && (
                    <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">Acknowledged</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  From: <span className="text-gray-600 font-medium">{selectedMemo.sender}</span>
                  {selectedMemo.senderDetails?.department && ` · ${selectedMemo.senderDetails.department}`}
                  <span className="mx-2 text-gray-200">|</span>
                  {selectedMemo.date}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusPill status={selectedMemo.status} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${selectedMemo.memo_type === 'report' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {selectedMemo.memo_type === 'report' ? 'Report' : 'Memo'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedMemo.created_by === user.id && (
                  <button onClick={() => handleDeleteMemo(selectedMemo.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                    <Trash size={15} weight="duotone" />
                  </button>
                )}
                <button onClick={() => setSelectedMemo(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition">
                  <X size={15} weight="bold" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Content */}
              <div className="prose prose-sm max-w-none mb-6">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                  {selectedMemo.content}
                </pre>
              </div>

              {/* Attachments */}
              {selectedMemo.attachments && (() => {
                try {
                  const files = JSON.parse(selectedMemo.attachments);
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
                                <FileText size={14} weight="duotone" className="text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">{file.originalname}</p>
                                <p className="text-[10px] text-gray-400">{formatFileSize(file.size)} · {file.mimetype?.split('/')[1]?.toUpperCase()}</p>
                              </div>
                            </div>
                            <a href={`${import.meta.env.VITE_BASE_URL}/memos/download/${selectedMemo.id}/${file.filename}`}
                              download={file.originalname} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1E5269] hover:bg-white transition">
                              <ArrowDown size={14} weight="bold" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Approval Pipeline */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Approval Pipeline</p>
                <div className="flex gap-2 flex-wrap">
                  {['manager', 'executive', 'finance', 'gmd', 'chairman'].map(role => {
                    const approved = selectedMemo[`approved_by_${role}`] === 1;
                    const rejected = selectedMemo[`rejected_by_${role}`] === 1;
                    return (
                      <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                        approved ? 'bg-green-50 border-green-100 text-green-700' :
                        rejected ? 'bg-red-50 border-red-100 text-red-600' :
                        'bg-gray-50 border-gray-100 text-gray-400'
                      }`}>
                        {approved ? <CheckCircle size={12} weight="fill" /> : rejected ? <XCircle size={12} weight="fill" /> : <Clock size={12} weight="duotone" />}
                        <span className="capitalize">{role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Acknowledgment for reports */}
              {selectedMemo.memo_type === 'report' && !selectedMemo.acknowledged && (
                <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#1E5269] rounded"
                      onChange={e => { if (e.target.checked) handleAcknowledge(selectedMemo); }} />
                    <span className="text-sm text-amber-800 font-medium">I acknowledge this memo</span>
                  </label>
                </div>
              )}

              {selectedMemo.memo_type === 'report' && (
                <div className="mb-4">
                  {/* Pending roles (string entries) */}
                  {selectedMemo.acknowledgments?.filter(a => typeof a === 'string').length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pending Acknowledgment From</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemo.acknowledgments.filter(a => typeof a === 'string').map((role, idx) => (
                          <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-100">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Acknowledged users (object entries) */}
                  {selectedMemo.acknowledgments?.filter(a => typeof a === 'object').length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Acknowledged by</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemo.acknowledgments.filter(a => typeof a === 'object').map(a => (
                          <span key={a.id} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-xl border border-green-100">
                            {a.name} · {a.role}{a.dept && ` (${a.dept})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pay button (Finance) */}
              {user.role?.toLowerCase() === 'finance' && activeTab === FINANCE_TABS.TO_BE_ACTED && !financeActionedMemos.includes(selectedMemo.id) && (
                <div className="mb-4">
                  <button onClick={() => handlePay(selectedMemo)}
                    className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition">
                    Mark as Paid
                  </button>
                </div>
              )}

              {/* Approve/Reject */}
              {(() => {
                const userRole = user?.role?.toLowerCase();
                const normalizeRole = r => (r?.includes('executive') || r?.includes('ict')) ? 'executive' : r;
                const nr = normalizeRole(userRole);
                const approved = selectedMemo[`approved_by_${nr}`] === 1;
                const rejected = selectedMemo[`rejected_by_${nr}`] === 1;
                const acted = approved || rejected;
                const isExec = userRole?.includes('executive') || userRole?.includes('ict');
                const isAuthorized = ['manager', 'finance', 'gmd', 'chairman'].includes(userRole) || isExec;
                const statusOk = ['pending', 'submitted', 'in_review'].includes(selectedMemo.status);
                const isChairman = userRole === 'chairman';
                const canShow = (isAuthorized && !acted && statusOk) || (isChairman && !approved && !rejected);
                if (!canShow) return null;

                return (
                  <div className="space-y-3">
                    {/* Approval textarea */}
                    {showApprovalComment && userRole !== 'chairman' && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-800 mb-2">Recommendation</p>
                        <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)}
                          placeholder="Enter recommendations…" rows="3"
                          className="w-full text-sm px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white" />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => { setShowApprovalComment(false); setApprovalComment(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-white rounded-lg transition">Cancel</button>
                          <button onClick={() => handleApprove(selectedMemo)} disabled={!approvalComment.trim()}
                            className="px-4 py-1.5 text-xs font-medium bg-[#1E5269] text-white rounded-lg disabled:opacity-40">Submit Approval</button>
                        </div>
                      </div>
                    )}
                    {/* Rejection textarea */}
                    {showRejectionComment && userRole !== 'chairman' && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs font-semibold text-red-800 mb-2">Rejection Remark</p>
                        <textarea value={rejectionComment} onChange={e => setRejectionComment(e.target.value)}
                          placeholder="Enter remarks…" rows="3"
                          className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 resize-none bg-white" />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => { setShowRejectionComment(false); setRejectionComment(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-white rounded-lg transition">Cancel</button>
                          <button onClick={() => handleReject(selectedMemo)} disabled={!rejectionComment.trim()}
                            className="px-4 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg disabled:opacity-40">Submit Rejection</button>
                        </div>
                      </div>
                    )}
                    {/* Buttons */}
                    {!showApprovalComment && !showRejectionComment && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => isChairman ? handleReject(selectedMemo) : (setShowRejectionComment(true), setShowApprovalComment(false))}
                          className="px-5 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition">
                          Reject
                        </button>
                        <button
                          onClick={() => isChairman ? handleApprove(selectedMemo) : (setShowApprovalComment(true), setShowRejectionComment(false))}
                          className="px-5 py-2 text-sm font-medium bg-[#1E5269] text-white rounded-xl hover:bg-[#1E5269]/90 transition">
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Comments */}
              <CommentSection memoId={selectedMemo.id} user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoList;