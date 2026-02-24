import { useState } from 'react'

const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

const departments = ['All', 'IT', 'HR', 'Finance', 'Operations', 'Marketing']

const statusConfig = {
  paid: { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Paid' },
  pending: { bg: '#fffbeb', text: '#92400e', dot: '#d97706', label: 'Pending' },
}

const initialEmployees = [
  { id: 1, name: 'Chisom Okafor', department: 'IT', bankName: 'GTBank', accountNumber: '****1234', basicSalary: 350000, deductions: 35000, bonuses: 20000, netSalary: 335000, status: 'paid' },
  { id: 2, name: 'Ngozi Adeyemi', department: 'HR', bankName: 'Access Bank', accountNumber: '****5678', basicSalary: 280000, deductions: 14000, bonuses: 0, netSalary: 266000, status: 'paid' },
  { id: 3, name: 'Emeka Johnson', department: 'Finance', bankName: 'First Bank', accountNumber: '****9012', basicSalary: 420000, deductions: 0, bonuses: 35000, netSalary: 455000, status: 'pending' },
  { id: 4, name: 'Aisha Bello', department: 'Operations', bankName: 'Zenith Bank', accountNumber: '****3456', basicSalary: 310000, deductions: 21000, bonuses: 15000, netSalary: 304000, status: 'pending' },
  { id: 5, name: 'Tunde Bakare', department: 'Marketing', bankName: 'UBA', accountNumber: '****7890', basicSalary: 295000, deductions: 10000, bonuses: 25000, netSalary: 310000, status: 'paid' },
]

const PayrollList = () => {
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ deductions: 0, bonuses: 0, reason: '' })
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [notification, setNotification] = useState(null)

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const filteredEmployees = employees
    .filter(e =>
      (e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterDept === 'All' || e.department === filterDept) &&
      (filterStatus === 'All' || e.status === filterStatus)
    )
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handleEdit = (employee) => {
    setEditingId(employee.id)
    setEditForm({ deductions: employee.deductions, bonuses: employee.bonuses, reason: '' })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: name === 'reason' ? value : Number(value) }))
  }

  const handleSave = (id) => {
    setEmployees(employees.map(emp => {
      if (emp.id !== id) return emp
      const netSalary = emp.basicSalary - editForm.deductions + editForm.bonuses
      return { ...emp, deductions: editForm.deductions, bonuses: editForm.bonuses, netSalary, status: netSalary !== emp.netSalary ? 'pending' : emp.status }
    }))
    setEditingId(null)
    showNotification('Payroll updated successfully')
  }

  const handlePay = (id) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, status: 'paid' } : e))
    showNotification('Payment processed successfully')
  }

  const totalPayroll = filteredEmployees.reduce((s, e) => s + e.netSalary, 0)
  const pendingCount = filteredEmployees.filter(e => e.status === 'pending').length
  const paidCount = filteredEmployees.filter(e => e.status === 'paid').length

  const SortArrow = ({ field }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, gap: 0, verticalAlign: 'middle' }}>
      <span style={{ fontSize: 8, lineHeight: 1, opacity: sortField === field && sortDir === 'asc' ? 1 : 0.25 }}>▲</span>
      <span style={{ fontSize: 8, lineHeight: 1, opacity: sortField === field && sortDir === 'desc' ? 1 : 0.25 }}>▼</span>
    </span>
  )

  const avatarColors = [
    ['#fef9c3','#713f12'], ['#dbeafe','#1e3a5f'], ['#fce7f3','#831843'],
    ['#d1fae5','#064e3b'], ['#ede9fe','#3b0764']
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f4f6fb', minHeight: '100vh', padding: '32px 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .p-card { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04); }
        .stat { background: #fff; border-radius: 14px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1.5px solid #f0f0f0; transition: transform .15s, box-shadow .15s; }
        .stat:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
        .inp { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 9px 13px; font-family: inherit; font-size: 14px; outline: none; background: white; transition: border-color .15s; width: 100%; }
        .inp:focus { border-color: #1a1f36; }
        .einp { border: 1.5px solid #d1d5db; border-radius: 8px; padding: 5px 8px 5px 22px; font-family: 'DM Mono', monospace; font-size: 13px; width: 120px; outline: none; }
        .einp:focus { border-color: #1a1f36; }
        .btn { border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 8px; padding: 7px 14px; transition: all .15s; }
        .btn-dark { background: #1a1f36; color: #fff; }
        .btn-dark:hover { background: #2d3452; }
        .btn-pay { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .btn-pay:hover { background: #d1fae5; }
        .btn-ghost { background: transparent; color: #6b7280; padding: 7px 10px; }
        .btn-ghost:hover { background: #f3f4f6; color: #111827; }
        .thb { background: none; border: none; cursor: pointer; font-family: inherit; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; padding: 0; display: inline-flex; align-items: center; }
        .thb:hover { color: #1a1f36; }
        .tr { transition: background .1s; }
        .tr:hover { background: #f9fafb !important; }
        .notif { position: fixed; top: 20px; right: 20px; padding: 13px 18px; border-radius: 12px; font-size: 13.5px; font-weight: 500; box-shadow: 0 8px 30px rgba(0,0,0,0.13); z-index: 9999; animation: slip .25s ease; }
        @keyframes slip { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform:none; } }
      `}</style>

      {notification && (
        <div className="notif" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          ✓ {notification.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>Payroll Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>Nigerian Naira (₦) · Manage salaries, deductions & bonuses</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '8px 14px' }}>
          <span style={{ fontSize: 20 }}>🇳🇬</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>NGN</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Payroll', value: formatNaira(totalPayroll), sub: `${filteredEmployees.length} employees`, accent: '#1a1f36' },
          { label: 'Pending', value: pendingCount, sub: 'awaiting payment', accent: '#d97706' },
          { label: 'Paid', value: paidCount, sub: 'this cycle', accent: '#059669' },
          { label: 'Avg. Net Salary', value: filteredEmployees.length ? formatNaira(Math.round(totalPayroll / filteredEmployees.length)) : '₦0.00', sub: 'per employee', accent: '#6366f1' },
        ].map(s => (
          <div className="stat" key={s.label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: s.accent, fontFamily: typeof s.value === 'string' ? 'DM Mono, monospace' : 'inherit' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="p-card" style={{ padding: '22px 22px 18px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
            <input type="text" placeholder="Search name or department..." className="inp" style={{ paddingLeft: 34 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="inp" style={{ flex: '0 1 auto', width: 'auto' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            {departments.map(d => <option key={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <select className="inp" style={{ flex: '0 1 auto', width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {[
                  { l: 'Employee', f: 'name' }, { l: 'Department', f: 'department' },
                  { l: 'Bank Details', f: null }, { l: 'Basic Salary', f: 'basicSalary' },
                  { l: 'Deductions', f: 'deductions' }, { l: 'Bonuses', f: 'bonuses' },
                  { l: 'Net Salary', f: 'netSalary' }, { l: 'Status', f: 'status' },
                  { l: 'Actions', f: null }
                ].map(col => (
                  <th key={col.l} style={{ padding: '10px 14px', textAlign: col.l === 'Actions' ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                    {col.f ? <button className="thb" onClick={() => handleSort(col.f)}>{col.l}<SortArrow field={col.f} /></button> : <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9ca3af' }}>{col.l}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? filteredEmployees.map((emp, i) => {
                const sc = statusConfig[emp.status] || statusConfig.pending
                const isEditing = editingId === emp.id
                const [abg, atx] = avatarColors[(emp.id - 1) % avatarColors.length]
                return (
                  <tr key={emp.id} className="tr" style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: abg, color: atx, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600 }}>{emp.department}</span>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>{emp.bankName}</div>
                      <div style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'DM Mono, monospace', marginTop: 1 }}>{emp.accountNumber}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontFamily: 'DM Mono, monospace', color: '#374151' }}>{formatNaira(emp.basicSalary)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      {isEditing ? (
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6b7280', fontFamily: 'DM Mono, monospace' }}>₦</span>
                          <input type="number" name="deductions" value={editForm.deductions} onChange={handleEditChange} className="einp" min="0" />
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'DM Mono, monospace', color: emp.deductions > 0 ? '#dc2626' : '#d1d5db', fontWeight: emp.deductions > 0 ? 500 : 400 }}>
                          {emp.deductions > 0 ? `−\u00A0${formatNaira(emp.deductions)}` : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      {isEditing ? (
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6b7280', fontFamily: 'DM Mono, monospace' }}>₦</span>
                          <input type="number" name="bonuses" value={editForm.bonuses} onChange={handleEditChange} className="einp" min="0" />
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'DM Mono, monospace', color: emp.bonuses > 0 ? '#059669' : '#d1d5db', fontWeight: emp.bonuses > 0 ? 500 : 400 }}>
                          {emp.bonuses > 0 ? `+\u00A0${formatNaira(emp.bonuses)}` : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#111827', fontSize: 14 }}>{formatNaira(emp.netSalary)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }}></span>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="btn btn-dark" onClick={() => handleSave(emp.id)}>Save</button>
                          <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="btn btn-ghost" onClick={() => handleEdit(emp)}>Edit</button>
                          {emp.status === 'pending' && (
                            <button className="btn btn-pay" onClick={() => handlePay(emp.id)}>Pay Now</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="9" style={{ padding: '52px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontWeight: 600, color: '#374151', fontSize: 15 }}>No employees found</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Try adjusting your search or filters</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Reason Panel */}
        {editingId && (
          <div style={{ marginTop: 18, padding: '16px 18px', background: '#f9fafb', borderRadius: 12, border: '1.5px solid #e5e7eb' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              Reason for Deduction / Bonus <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea name="reason" value={editForm.reason} onChange={handleEditChange} rows="3" className="inp" placeholder="e.g. Q1 performance bonus, unpaid leave deduction..." style={{ resize: 'vertical' }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>Showing {filteredEmployees.length} of {employees.length} employees</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Total: <strong style={{ fontFamily: 'DM Mono, monospace', color: '#111827', fontSize: 14 }}>{formatNaira(employees.reduce((s, e) => s + e.netSalary, 0))}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

export default PayrollList