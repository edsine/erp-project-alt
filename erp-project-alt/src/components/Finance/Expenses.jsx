import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const ExpensesModule = () => {
  // Load data from localStorage or use empty array
  const BASE_URL = import.meta.env.VITE_BASE_URL

  
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    day: '', month: '', week: '', date: '', voucherCode: '', transactionDetails: '',
    spent: '', category: '', costCentre: '', subCostCentre: '', bankDebited: ''
  })
  const [loading, setLoading] = useState(false)
  const [newRowId, setNewRowId] = useState(null) // Track newly added row for auto-edit
  const [expensesData, setExpensesData] = useState([])

useEffect(() => {
  const loadExpenses = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${BASE_URL}/finance/expense`)
      if (!res.ok) throw new Error('Failed to fetch expenses')

      const data = await res.json()

      const mapped = data.map(item => {
        const d = new Date(item.transaction_date)

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
        }
      })

      setExpensesData(mapped)
      setFilteredData(mapped)
    } catch (err) {
      console.error(err)
      alert('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  loadExpenses()
}, [])


  // Filter data based on search and date range
  useEffect(() => {
    let filtered = expensesData

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        const fromDate = new Date(dateRange.from)
        const toDate = new Date(dateRange.to)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    setFilteredData(filtered)
  }, [searchTerm, dateRange, expensesData])

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({
      day: expense.day || '',
      month: expense.month || '',
      week: expense.week || '',
      date: expense.date || '',
      voucherCode: expense.voucherCode || '',
      transactionDetails: expense.transactionDetails || '',
      spent: expense.spent || '',
      category: expense.category || '',
      costCentre: expense.costCentre || '',
      subCostCentre: expense.subCostCentre || '',
      bankDebited: expense.bankDebited || 'No'
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    
    // Auto-calculate week based on date if date field is being edited
    if (name === 'date' && value) {
      const day = new Date(value).getDate()
      const week = Math.ceil(day / 7)
      const month = new Date(value).toLocaleString('default', { month: 'short' }).toUpperCase()
      
      setEditForm(prev => ({ 
        ...prev, 
        [name]: value,
        day: day.toString(),
        month: month,
        week: week
      }))
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }))
    }
  }

const handleSave = async (id) => {
  try {
    setLoading(true)

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
    })

    if (!res.ok) throw new Error('Update failed')

    const updated = await res.json()

    setExpensesData(prev =>
      prev.map(e => (e.id === id ? { ...e, ...editForm, spent: Number(editForm.spent) } : e))
    )

    setEditingId(null)
    setNewRowId(null)
  } catch (err) {
    console.error(err)
    alert('Failed to update expense')
  } finally {
    setLoading(false)
  }
}


const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this expense?')) return

  try {
    setLoading(true)

    const res = await fetch(`${BASE_URL}/finance/expense/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) throw new Error('Delete failed')

    setExpensesData(prev => prev.filter(e => e.id !== id))
  } catch (err) {
    console.error(err)
    alert('Failed to delete expense')
  } finally {
    setLoading(false)
  }
}



const handleAddNew = async () => {
  try {
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]

    const res = await fetch(`${BASE_URL}/finance/expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionDate: today,
        voucherNo: '',
        transactionDetails: '',
        spent: 0,
        category: '',
        costCentre: '',
        subCostCentre: null,
        bankDebited: 'No',
        createdBy: 1
      })
    })

    if (!res.ok) throw new Error('Create failed')

    const saved = await res.json()
    const d = new Date(saved.transaction_date)

    const newRow = {
      id: saved.id,
      day: d.getDate().toString(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(d.getDate() / 7),
      date: saved.transaction_date,
      voucherCode: saved.voucher_no,
      transactionDetails: saved.transaction_details,
      spent: Number(saved.spent),
      category: saved.category,
      costCentre: saved.cost_centre,
      subCostCentre: saved.sub_cost_centre,
      bankDebited: saved.bank_debited
    }

    setExpensesData(prev => [newRow, ...prev])
    setEditingId(newRow.id)
    setNewRowId(newRow.id)
    setEditForm(newRow)
  } catch (err) {
    console.error(err)
    alert('Failed to create expense')
  } finally {
    setLoading(false)
  }
}


  const handleImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const importedData = jsonData.map((row, index) => {
            // Parse date and calculate week
            const rowDate = row['DATE'] || row.Date || row.date
            let dateObj = new Date()
            let week = 1
            let month = ''
            let day = ''
            
            if (rowDate) {
              dateObj = new Date(rowDate)
              day = dateObj.getDate().toString()
              month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()
              week = Math.ceil(dateObj.getDate() / 7)
            }
            
            return {
              id: Date.now() + index,
              day: day || String(row['DAY'] || row.Day || row.day || ''),
              month: month || String(row['MONTH'] || row.Month || row.month || ''),
              week: week || Number(row['WEEK'] || row.Week || row.week || 1),
              date: rowDate || new Date().toISOString().split('T')[0],
              voucherCode: String(row['VOUCHER CODE'] || row['Voucher Code'] || row.voucherCode || `IMP-${Date.now()}-${index}`),
              transactionDetails: String(row['TRANSACTION DETAILS'] || row['Transaction Details'] || row.transactionDetails || ''),
              spent: Number(row['SPENT'] || row.Spent || row.spent || 0),
              category: String(row['CATEGORY'] || row.Category || row.category || ''),
              costCentre: String(row['COST CENTRE'] || row['Cost Centre'] || row.costCentre || ''),
              subCostCentre: String(row['SUB COST CENTRE'] || row['Sub Cost Centre'] || row.subCostCentre || ''),
              bankDebited: String(row['BANK DEBITED'] || row['Bank Debited'] || row.bankDebited || 'No'),
              importedAt: new Date().toISOString()
            }
          })

          // Add to existing data
          setExpensesData(prev => [...prev, ...importedData])
          event.target.value = ''
          alert(`Successfully imported ${importedData.length} expense records!`)
        } catch (error) {
          console.error('Error processing import file:', error)
          alert('Error importing Excel file. Please check the format and column names.')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error importing expense data:', error)
      alert('Error importing expense data')
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (expensesData.length === 0) {
      alert('No data to export')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(expensesData.map(item => ({
      'DAY': item.day,
      'MONTH': item.month,
      'WEEK': item.week,
      'DATE': item.date,
      'VOUCHER CODE': item.voucherCode,
      'TRANSACTION DETAILS': item.transactionDetails,
      'SPENT': item.spent,
      'CATEGORY': item.category,
      'COST CENTRE': item.costCentre,
      'SUB COST CENTRE': item.subCostCentre,
      'BANK DEBITED': item.bankDebited
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Data')
    XLSX.writeFile(workbook, `expenses_data_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL expense records? This cannot be undone.')) {
      setExpensesData([])
      localStorage.removeItem('expensesData')
      setEditingId(null)
      setNewRowId(null)
    }
  }

  const totalExpenses = filteredData.reduce((sum, item) => sum + (item.spent || 0), 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Processing...</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">ANNUAL EXPENSES </h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search expense records..."
            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleAddNew}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>
        <div className="flex items-end space-x-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            id="expenses-import"
          />
          <label
            htmlFor="expenses-import"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 cursor-pointer"
          >
            Import Excel
          </label>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export Excel
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">TOTAL SPENT:</span>
          <span className="text-xl font-bold text-red-600">₦{totalExpenses.toLocaleString()}</span>
          <span className="text-sm text-gray-500">
            {expensesData.length} record(s) | {filteredData.length} filtered
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">S/NO</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DAY</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">MONTH</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">WEEK</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DATE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">VOUCHER CODE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">TRANSACTION DETAILS</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SPENT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">CATEGORY</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">COST CENTRE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SUB COST CENTRE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">BANK DEBITED</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((expense, index) => (
                <tr key={expense.id} className={`hover:bg-gray-50 ${newRowId === expense.id ? 'bg-blue-50' : ''}`}>
                  {/* Serial Number - Auto-generated and not editable */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  
                  {/* DAY - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {expense.day || '--'}
                  </td>
                  
                  {/* MONTH - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {expense.month || '--'}
                  </td>
                  
                  {/* WEEK - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {expense.week || '--'}
                  </td>
                  
                  {/* DATE Field - Editable, will auto-calculate day/month/week */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-500">{expense.date || '--'}</span>
                    )}
                  </td>
                  
                  {/* VOUCHER CODE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="voucherCode"
                        value={editForm.voucherCode}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter voucher code"
                      />
                    ) : (
                      <span className={`${!expense.voucherCode ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {expense.voucherCode || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* TRANSACTION DETAILS - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="transactionDetails"
                        value={editForm.transactionDetails}
                        onChange={handleEditChange}
                        className="w-64 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter transaction details"
                      />
                    ) : (
                      <span className={`${!expense.transactionDetails ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {expense.transactionDetails || 'No details'}
                      </span>
                    )}
                  </td>
                  
                  {/* SPENT AMOUNT - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        name="spent"
                        value={editForm.spent}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(expense.spent || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* CATEGORY - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter category"
                      />
                    ) : (
                      <span className={`${!expense.category ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {expense.category || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* COST CENTRE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="costCentre"
                        value={editForm.costCentre}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter cost centre"
                      />
                    ) : (
                      <span className={`${!expense.costCentre ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {expense.costCentre || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* SUB COST CENTRE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="subCostCentre"
                        value={editForm.subCostCentre}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter sub cost centre"
                      />
                    ) : (
                      <span className={`${!expense.subCostCentre ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {expense.subCostCentre || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* BANK DEBITED - Dropdown selection */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === expense.id ? (
                      <select
                        name="bankDebited"
                        value={editForm.bankDebited}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <span className={`font-medium ${expense.bankDebited === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                        {expense.bankDebited || 'No'}
                      </span>
                    )}
                  </td>
                  
                  {/* ACTIONS */}
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === expense.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(expense.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setNewRowId(null)
                            // If this was a new row being edited and cancelled, remove it
                            if (newRowId === expense.id) {
                              handleDelete(expense.id)
                            }
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
                  {expensesData.length === 0 ? 'No expense records. Click "Add Expense" to get started.' : 'No records match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  )
}

export default ExpensesModule