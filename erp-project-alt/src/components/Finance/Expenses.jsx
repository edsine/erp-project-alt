// ExpensesModule.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';

const ExpensesModule = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    day: '', month: '', week: '', date: '', voucherCode: '', transactionDetails: '',
    spent: '', category: '', costCentre: '', subCostCentre: '', bankDebited: ''
  });
  const [loading, setLoading] = useState(false);
  const [expensesData, setExpensesData] = useState([]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/finance/expense`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      const mapped = data.map(item => {
        const d = new Date(item.transaction_date);
        return {
          id: item.id,
          day: d.getDate().toString(),
          month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
          week: Math.ceil(d.getDate() / 7),
          date: item.transaction_date,
          voucherCode: item.voucher_no,
          transactionDetails: item.transaction_details,
          spent: Number(item.spent),
          category: item.category,
          costCentre: item.cost_centre,
          subCostCentre: item.sub_cost_centre,
          bankDebited: item.bank_debited
        };
      });
      setExpensesData(mapped);
      setFilteredData(mapped);
    } catch (err) {
      console.error(err);
      alert('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  useEffect(() => {
    let filtered = expensesData;
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, dateRange, expensesData]);

  const handleEdit = useCallback((expense) => {
    setEditingId(expense.id);
    setEditForm(expense);
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
      const res = await fetch(`${BASE_URL}/finance/expense/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionDate: editForm.date,
          voucherNo: editForm.voucherCode,
          transactionDetails: editForm.transactionDetails,
          spent: Number(editForm.spent) || 0,
          category: editForm.category,
          costCentre: editForm.costCentre,
          subCostCentre: editForm.subCostCentre,
          bankDebited: editForm.bankDebited
        })
      });
      if (!res.ok) throw new Error('Update failed');
      await loadExpenses();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update expense');
    } finally {
      setLoading(false);
    }
  }, [editForm]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/finance/expense/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddNew = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/finance/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionDate: today, voucherNo: '', transactionDetails: '', spent: 0, category: '', costCentre: '', subCostCentre: null, bankDebited: 'No', createdBy: 1 })
      });
      if (!res.ok) throw new Error('Create failed');
      await loadExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to create expense');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/finance/import-excel`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Import failed');
      alert(result.message || 'Import successful');
      await loadExpenses();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }, []);

  const handleExport = useCallback(async () => {
    const response = await fetch(`${BASE_URL}/finance/expense/export`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const handleClearAll = useCallback(() => {
    if (confirm('Are you sure you want to clear ALL expense records? This cannot be undone.')) {
      setExpensesData([]);
      localStorage.removeItem('expensesData');
      setEditingId(null);
    }
  }, []);

  const totalExpenses = useMemo(() => filteredData.reduce((sum, item) => sum + (item.spent || 0), 0), [filteredData]);

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Annual Expenses</h2>
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search expenses..." className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={handleAddNew} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-sm hover:bg-primary/90">Add Expense</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div><label className="block text-xs text-gray-500 mb-1">From Date</label><input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">To Date</label><input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
        <div className="flex items-end gap-2">
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" id="expenses-import" />
          <label htmlFor="expenses-import" className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm cursor-pointer hover:bg-gray-700">Import Excel</label>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700">Export Excel</button>
          <button onClick={handleClearAll} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">Clear All</button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-transparent rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Total Cost</span>
        <span className="text-2xl font-bold text-red-600">₦{totalExpenses.toLocaleString()}</span>
        <span className="text-xs text-gray-400">{expensesData.length} total | {filteredData.length} filtered</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['S/NO', 'DAY', 'MONTH', 'WEEK', 'DATE', 'VOUCHER CODE', 'TRANSACTION DETAILS', 'COST', 'CATEGORY', 'COST CENTRE', 'SUB COST CENTRE', 'BANK DEBITED', 'ACTIONS'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((expense, idx) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3 text-sm">{expense.day || '—'}</td>
                <td className="px-4 py-3 text-sm">{expense.month || '—'}</td>
                <td className="px-4 py-3 text-sm">{expense.week || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  {editingId === expense.id ? <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="w-32 px-2 py-1 border rounded-lg" /> : expense.date || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === expense.id ? <input type="text" name="voucherCode" value={editForm.voucherCode} onChange={handleEditChange} className="w-32 px-2 py-1 border rounded-lg" /> : expense.voucherCode || 'Not set'}
                </td>
                <td className="px-4 py-3 text-sm max-w-xs break-words whitespace-normal">
                  {editingId === expense.id ? <input type="text" name="transactionDetails" value={editForm.transactionDetails} onChange={handleEditChange} className="w-64 px-2 py-1 border rounded-lg" /> : expense.transactionDetails || 'No details'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === expense.id ? <input type="number" name="spent" value={editForm.spent} onChange={handleEditChange} className="w-32 px-2 py-1 border rounded-lg" /> : `₦${(expense.spent || 0).toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editingId === expense.id ? <input type="text" name="category" value={editForm.category} onChange={handleEditChange} className="w-32 px-2 py-1 border rounded-lg" /> : expense.category || 'Not set'}
                </td>
                <td className="px-4 py-3 text-sm">{expense.costCentre || '—'}</td>
                <td className="px-4 py-3 text-sm">{expense.subCostCentre || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  {editingId === expense.id ? (
                    <select name="bankDebited" value={editForm.bankDebited} onChange={handleEditChange} className="w-24 px-2 py-1 border rounded-lg">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <span className={expense.bankDebited === 'Yes' ? 'text-green-600 font-medium' : 'text-red-600'}>{expense.bankDebited || 'No'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {editingId === expense.id ? (
                    <div className="flex gap-2"><button onClick={() => handleSave(expense.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">Save</button><button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-500 text-white rounded-lg text-xs">Cancel</button></div>
                  ) : (
                    <div className="flex gap-2"><button onClick={() => handleEdit(expense)} className="px-3 py-1 bg-primary text-white rounded-lg text-xs">Edit</button><button onClick={() => handleDelete(expense.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs">Delete</button></div>
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

export default ExpensesModule;