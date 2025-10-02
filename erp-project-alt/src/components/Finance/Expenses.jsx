import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const ExpensesModule = () => {
  const [expensesData, setExpensesData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    day: '',
    month: '',
    week: '',
    voucher: '',
    transactionDetails: '',
    spent: '',
    category: '',
    costCentre: '',
    subCostCentre: '',
    bankDebited: ''
  })

  // Sample initial data matching your template
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        day: '10',
        month: 'JAN',
        week: 2,
        voucher: 'EXP-001',
        transactionDetails: 'Office Supplies Purchase',
        spent: 150000,
        category: 'Office Expenses',
        costCentre: 'Administration',
        subCostCentre: 'Supplies',
        bankDebited: 'Yes',
        date: '2024-01-10'
      },
      {
        id: 2,
        day: '18',
        month: 'JAN',
        week: 3,
        voucher: 'EXP-002',
        transactionDetails: 'Software Subscription Renewal',
        spent: 75000,
        category: 'Technology',
        costCentre: 'IT Department',
        subCostCentre: 'Software',
        bankDebited: 'Yes',
        date: '2024-01-18'
      }
    ]
    setExpensesData(sampleData)
    setFilteredData(sampleData)
  }, [])

  // Filter data based on search and date range
  useEffect(() => {
    let filtered = expensesData

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
      day: expense.day,
      month: expense.month,
      week: expense.week,
      voucher: expense.voucher,
      transactionDetails: expense.transactionDetails,
      spent: expense.spent,
      category: expense.category,
      costCentre: expense.costCentre,
      subCostCentre: expense.subCostCentre,
      bankDebited: expense.bankDebited
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = (id) => {
    setExpensesData(expensesData.map(expense => {
      if (expense.id === id) {
        return {
          ...expense,
          ...editForm,
          spent: Number(editForm.spent),
          week: Number(editForm.week)
        }
      }
      return expense
    }))
    setEditingId(null)
  }

  const handleDelete = (id) => {
    setExpensesData(expensesData.filter(expense => expense.id !== id))
  }

  const handleAddNew = () => {
    const newExpense = {
      id: Date.now(),
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(new Date().getDate() / 7),
      voucher: `EXP-${Date.now()}`,
      transactionDetails: '',
      spent: 0,
      category: '',
      costCentre: '',
      subCostCentre: '',
      bankDebited: 'No',
      date: new Date().toISOString().split('T')[0]
    }
    setExpensesData([...expensesData, newExpense])
    setEditingId(newExpense.id)
    setEditForm({
      day: newExpense.day,
      month: newExpense.month,
      week: newExpense.week,
      voucher: newExpense.voucher,
      transactionDetails: '',
      spent: '',
      category: '',
      costCentre: '',
      subCostCentre: '',
      bankDebited: 'No'
    })
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const importedData = jsonData.map((row, index) => ({
            id: Date.now() + index,
            day: row.Day || '',
            month: row.Month || '',
            week: row.Week || 1,
            voucher: row.Voucher || '',
            transactionDetails: row['Transaction Details'] || '',
            spent: Number(row.Spent) || 0,
            category: row.Category || '',
            costCentre: row['Cost Centre'] || '',
            subCostCentre: row['Sub Cost Centre'] || '',
            bankDebited: row['Bank Debited'] || 'No',
            date: row.Date || new Date().toISOString().split('T')[0]
          }))
          
          setExpensesData([...expensesData, ...importedData])
        } catch (error) {
          console.error('Error parsing Excel file:', error)
          alert('Error importing file. Please check the format.')
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(expensesData.map(item => ({
      'Day': item.day,
      'Month': item.month,
      'Week': item.week,
      'Voucher': item.voucher,
      'Transaction Details': item.transactionDetails,
      'Spent': item.spent,
      'Category': item.category,
      'Cost Centre': item.costCentre,
      'Sub Cost Centre': item.subCostCentre,
      'Bank Debited': item.bankDebited,
      'Date': item.date
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Data')
    XLSX.writeFile(workbook, 'expenses_data.xlsx')
  }

  const totalExpenses = filteredData.reduce((sum, item) => sum + item.spent, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">ANNUAL EXPENSES</h2>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search expense records..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MONTH UNDER REVIEW</label>
          <input
            type="month"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
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
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">TOTAL SPENT:</span>
          <span className="text-xl font-bold text-red-600">₦{totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TRANSACTION DETAILS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SPENT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COST CENTRE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SUB COST CENTRE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Debited</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="day"
                        value={editForm.day}
                        onChange={handleEditChange}
                        className="w-12 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.day
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <select
                        name="month"
                        value={editForm.month}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      >
                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    ) : (
                      expense.month
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        name="week"
                        value={editForm.week}
                        onChange={handleEditChange}
                        className="w-12 px-2 py-1 border border-gray-300 rounded-md"
                        min="1"
                        max="5"
                      />
                    ) : (
                      expense.week
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="voucher"
                        value={editForm.voucher}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.voucher
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="transactionDetails"
                        value={editForm.transactionDetails}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.transactionDetails
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        name="spent"
                        value={editForm.spent}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${expense.spent.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.category
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="costCentre"
                        value={editForm.costCentre}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.costCentre
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        name="subCostCentre"
                        value={editForm.subCostCentre}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      expense.subCostCentre
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === expense.id ? (
                      <select
                        name="bankDebited"
                        value={editForm.bankDebited}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      expense.bankDebited
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === expense.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(expense.id)}
                          className="text-primary hover:text-primary-dark"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-primary hover:text-primary-dark"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-900"
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
                <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                  No expense records found
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