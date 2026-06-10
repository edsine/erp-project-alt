// IncomeModule.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';

const IncomeModule = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    day: '', month: '', week: '', date: '', voucherCode: '', transactionDetails: '',
    income: '', stampDuty: '', wht: '', vat: '', grossAmount: '',
    incomeCentre: '', projectType: ''
  });
  const [loading, setLoading] = useState(false);
  const [incomeData, setIncomeData] = useState([]);

  const loadIncome = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/finance/income/table`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const mapped = data.map(item => {
        const dateObj = new Date(item.transaction_date);
        return {
          id: item.id,
          day: dateObj.getDate().toString(),
          month: dateObj.toLocaleString('default', { month: 'short' }).toUpperCase(),
          week: Math.ceil(dateObj.getDate() / 7),
          date: item.transaction_date.split('T')[0],
          voucherCode: item.voucher_no,
          transactionDetails: item.transaction_details,
          income: Number(item.income),
          stampDuty: Number(item.stamp),
          wht: Number(item.wht),
          vat: Number(item.vat),
          grossAmount: Number(item.gross_amount),
          incomeCentre: item.income_centre,
          projectType: item.project_type
        };
      });
      setIncomeData(mapped);
      setFilteredData(mapped);
    } catch (err) {
      console.error('LOAD INCOME ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
  }, []);

  useEffect(() => {
    let filtered = incomeData;
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    }
    setFilteredData(filtered);
  }, [searchTerm, dateRange, incomeData]);

  const handleEdit = useCallback((income) => {
    setEditingId(income.id);
    setEditForm(income);
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'date' && value) {
      const day = new Date(value).getDate();
      const week = Math.ceil(day / 7);
      const month = new Date(value).toLocaleString('default', { month: 'short' }).toUpperCase();
      setEditForm(prev => ({ ...prev, [name]: value, day: day.toString(), month, week }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSave = useCallback(async (id) => {
    try {
      setLoading(true);
      const isNew = id === '__new__';
      const payload = {
        transactionDate: editForm.date,
        voucherNo: editForm.voucherCode,
        transactionDetails: editForm.transactionDetails,
        income: Number(editForm.income) || 0,
        stamp: Number(editForm.stampDuty) || 0,
        wht: Number(editForm.wht) || 0,
        vat: Number(editForm.vat) || 0,
        incomeCentre: editForm.incomeCentre,
        projectType: editForm.projectType,
        project: '',
        ...(isNew && { createdBy: 1 })
      };
      const res = await fetch(isNew ? `${BASE_URL}/finance/income` : `${BASE_URL}/finance/income/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      await loadIncome();
      setEditingId(null);
    } catch (err) {
      console.error('SAVE ERROR:', err);
      alert('Failed to save income');
    } finally {
      setLoading(false);
    }
  }, [editForm]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/finance/income/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadIncome();
    } catch (err) {
      console.error('DELETE ERROR:', err);
      alert('Failed to delete income');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddNew = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const dateObj = new Date(today);
    const newRow = {
      id: '__new__',
      day: dateObj.getDate().toString(),
      month: dateObj.toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(dateObj.getDate() / 7),
      date: today,
      voucherCode: '',
      transactionDetails: '',
      income: 0,
      stampDuty: 0,
      wht: 0,
      vat: 0,
      grossAmount: 0,
      incomeCentre: '',
      projectType: '',
    };
    setIncomeData(prev => [newRow, ...prev]);
    setFilteredData(prev => [newRow, ...prev]);
    setEditForm(newRow);
    setEditingId('__new__');
  }, []);

  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/finance/income/import`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Import failed');
      const result = await res.json();
      alert(`Imported ${result.inserted} record(s)`);
      await loadIncome();
    } catch (err) {
      console.error('IMPORT ERROR:', err);
      alert('Failed to import Excel file');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }, []);

  const handleExport = useCallback(() => {
    window.location.href = `${BASE_URL}/finance/income/download`;
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
  }, []);

  const totalIncome = useMemo(() => filteredData.reduce((sum, item) => sum + (item.income - (item.stampDuty || 0)), 0), [filteredData]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Annual Income</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search income..."
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleAddNew} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-medium shadow-sm">
            Add Income
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
          <input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
          <input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div className="flex items-end gap-2">
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" id="income-import" />
          <label htmlFor="income-import" className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm hover:bg-gray-700 cursor-pointer transition">Import Excel</label>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition">Export Excel</button>
          <button onClick={handleClearAll} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">Clear All</button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Total Income (Income - Stamp Duty)</span>
        <span className="text-2xl font-bold text-primary">₦{totalIncome.toLocaleString()}</span>
        <span className="text-xs text-gray-400">{incomeData.length} total | {filteredData.length} filtered</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['S/NO', 'DAY', 'MONTH', 'WEEK', 'DATE', 'VOUCHER CODE', 'TRANSACTION DETAILS', 'INCOME', 'STAMP DUTY', 'WHT', 'VAT', 'GROSS AMOUNT', 'INCOME CENTRE', 'PROJECT TYPE', 'ACTIONS'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((income, idx) => (
              <tr key={income.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                {['day', 'month', 'week', 'date', 'voucherCode', 'transactionDetails', 'income', 'stampDuty', 'wht', 'vat', 'grossAmount', 'incomeCentre', 'projectType'].map(field => (
                  <td key={field} className="px-4 py-3 text-sm">
                    {editingId === income.id ? (
                      <input
                        type={['income', 'stampDuty', 'wht', 'vat'].includes(field) ? 'number' : 'text'}
                        name={field}
                        value={editForm[field] ?? ''}
                        onChange={handleEditChange}
                        className="w-full min-w-[80px] px-2 py-1 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      ['income', 'stampDuty', 'wht', 'vat', 'grossAmount'].includes(field)
                        ? `₦${(income[field] || 0).toLocaleString()}`
                        : income[field] || '—'
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {editingId === income.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(income.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(income)} className="px-3 py-1 bg-primary text-white rounded-lg text-xs">Edit</button>
                      <button onClick={() => handleDelete(income.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeModule;