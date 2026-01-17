import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const IncomeModule = () => {
  // Load data from localStorage or use empty array
  const [incomeData, setIncomeData] = useState(() => {
    const savedData = localStorage.getItem('incomeData')
    return savedData ? JSON.parse(savedData) : []
  })
  
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    day: '', month: '', week: '', date: '', voucherCode: '', transactionDetails: '',
    income: '', stampDuty: '', wht: '', vat: '', grossAmount: '',
    incomeCentre: '', projectType: ''
  })
  const [loading, setLoading] = useState(false)
  const [newRowId, setNewRowId] = useState(null)

  // Save to localStorage whenever incomeData changes
  useEffect(() => {
    localStorage.setItem('incomeData', JSON.stringify(incomeData))
  }, [incomeData])

  // Filter data based on search and date range
  useEffect(() => {
    let filtered = incomeData

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectType?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, dateRange, incomeData])

  const handleEdit = (income) => {
    setEditingId(income.id)
    setEditForm({
      day: income.day || '',
      month: income.month || '',
      week: income.week || '',
      date: income.date || '',
      voucherCode: income.voucherCode || '',
      transactionDetails: income.transactionDetails || '',
      income: income.income || '',
      stampDuty: income.stampDuty || '',
      wht: income.wht || '',
      vat: income.vat || '',
      grossAmount: income.grossAmount || '',
      incomeCentre: income.incomeCentre || '',
      projectType: income.projectType || ''
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

  const handleSave = (id) => {
    try {
      setLoading(true)
      
      // Auto-calculate week if date is provided
      let week = Number(editForm.week) || 1
      let month = editForm.month || ''
      let day = editForm.day || ''
      
      // If date is provided, calculate day, month, week
      if (editForm.date) {
        const dateObj = new Date(editForm.date)
        day = dateObj.getDate().toString()
        month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()
        week = Math.ceil(dateObj.getDate() / 7)
      }
      
      const updatedIncome = {
        ...editForm,
        day: day,
        month: month,
        week: week,
        income: Number(editForm.income) || 0,
        stampDuty: Number(editForm.stampDuty) || 0,
        wht: Number(editForm.wht) || 0,
        vat: Number(editForm.vat) || 0,
        grossAmount: Number(editForm.grossAmount) || 0,
        id: id // Ensure ID is preserved
      }

      // Update local state
      const updatedData = incomeData.map(income => {
        if (income.id === id) {
          return updatedIncome
        }
        return income
      })
      
      setIncomeData(updatedData)
      setEditingId(null)
      setNewRowId(null)
      
    } catch (error) {
      console.error('Error updating income:', error)
      alert('Error updating income record')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this income record?')) return

    try {
      setLoading(true)
      setIncomeData(incomeData.filter(income => income.id !== id))
      setNewRowId(null)
    } catch (error) {
      console.error('Error deleting income:', error)
      alert('Error deleting income record')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    const currentDate = new Date()
    const newIncome = {
      id: Date.now(),
      day: currentDate.getDate().toString(),
      month: currentDate.toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(currentDate.getDate() / 7),
      date: currentDate.toISOString().split('T')[0],
      voucherCode: '',
      transactionDetails: '',
      income: 0,
      stampDuty: 0,
      wht: 0,
      vat: 0,
      grossAmount: 0,
      incomeCentre: '',
      projectType: '',
      createdAt: currentDate.toISOString()
    }

    try {
      setLoading(true)
      
      setIncomeData(prev => [...prev, newIncome])
      
      // Automatically put the new row in edit mode
      setEditingId(newIncome.id)
      setNewRowId(newIncome.id)
      setEditForm({
        day: newIncome.day,
        month: newIncome.month,
        week: newIncome.week,
        date: newIncome.date,
        voucherCode: '',
        transactionDetails: '',
        income: 0,
        stampDuty: 0,
        wht: 0,
        vat: 0,
        grossAmount: 0,
        incomeCentre: '',
        projectType: ''
      })
      
    } catch (error) {
      console.error('Error creating income:', error)
      alert('Error creating income record')
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
              income: Number(row['INCOME'] || row.Income || row.income || 0),
              stampDuty: Number(row['STAMP DUTY'] || row['Stamp Duty'] || row.stampDuty || 0),
              wht: Number(row['WHT'] || row.Wht || row.wht || 0),
              vat: Number(row['VAT'] || row.Vat || row.vat || 0),
              grossAmount: Number(row['GROSS AMOUNT'] || row['Gross Amount'] || row.grossAmount || 0),
              incomeCentre: String(row['INCOME CENTRE'] || row['Income Centre'] || row.incomeCentre || ''),
              projectType: String(row['PROJECT TYPE'] || row['Project Type'] || row.projectType || ''),
              importedAt: new Date().toISOString()
            }
          })

          setIncomeData(prev => [...prev, ...importedData])
          event.target.value = ''
          alert(`Successfully imported ${importedData.length} income records!`)
        } catch (error) {
          console.error('Error processing import file:', error)
          alert('Error importing Excel file. Please check the format and column names.')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error importing income data:', error)
      alert('Error importing income data')
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (incomeData.length === 0) {
      alert('No data to export')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(incomeData.map(item => ({
      'DAY': item.day,
      'MONTH': item.month,
      'WEEK': item.week,
      'DATE': item.date,
      'VOUCHER CODE': item.voucherCode,
      'TRANSACTION DETAILS': item.transactionDetails,
      'INCOME': item.income,
      'STAMP DUTY': item.stampDuty,
      'WHT': item.wht,
      'VAT': item.vat,
      'GROSS AMOUNT': item.grossAmount,
      'INCOME CENTRE': item.incomeCentre,
      'PROJECT TYPE': item.projectType
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Data')
    XLSX.writeFile(workbook, `income_data_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL income records? This cannot be undone.')) {
      setIncomeData([])
      localStorage.removeItem('incomeData')
      setEditingId(null)
      setNewRowId(null)
    }
  }

  const totalIncome = filteredData.reduce((sum, item) => sum + ((item.income || 0) - (item.stampDuty || 0)), 0)
  const totalGrossAmount = filteredData.reduce((sum, item) => sum + (item.grossAmount || 0), 0)

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
        <h2 className="text-xl font-bold">ANNUAL INCOME</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search income records..."
            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleAddNew}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Add Income
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
            id="income-import"
          />
          <label
            htmlFor="income-import"
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
          <span className="text-lg font-semibold">TOTAL INCOME (Income - Stamp Duty):</span>
          <span className="text-xl font-bold text-green-600">₦{totalIncome.toLocaleString()}</span>
          <span className="text-sm text-gray-500">
            {incomeData.length} record(s) | {filteredData.length} filtered
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">INCOME</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">STAMP DUTY</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">WHT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">GROSS AMOUNT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">INCOME CENTRE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">PROJECT TYPE</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((income, index) => (
                <tr key={income.id} className={`hover:bg-gray-50 ${newRowId === income.id ? 'bg-blue-50' : ''}`}>
                  {/* Serial Number - Auto-generated */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  
                  {/* DAY - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {income.day || '--'}
                  </td>
                  
                  {/* MONTH - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {income.month || '--'}
                  </td>
                  
                  {/* WEEK - Auto-calculated from date */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {income.week || '--'}
                  </td>
                  
                  {/* DATE Field - Editable */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-500">{income.date || '--'}</span>
                    )}
                  </td>
                  
                  {/* VOUCHER CODE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="voucherCode"
                        value={editForm.voucherCode}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter voucher code"
                      />
                    ) : (
                      <span className={`${!income.voucherCode ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {income.voucherCode || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* TRANSACTION DETAILS - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <textarea
                        name="transactionDetails"
                        value={editForm.transactionDetails}
                        onChange={handleEditChange}
                        className="w-64 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter transaction details"
                        rows="1"
                      />
                    ) : (
                      <span className={`${!income.transactionDetails ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {income.transactionDetails || 'No details'}
                      </span>
                    )}
                  </td>
                  
                  {/* INCOME AMOUNT - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="income"
                        value={editForm.income}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(income.income || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* STAMP DUTY - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="stampDuty"
                        value={editForm.stampDuty}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(income.stampDuty || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* WHT - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="wht"
                        value={editForm.wht}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(income.wht || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* VAT - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="vat"
                        value={editForm.vat}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(income.vat || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* GROSS AMOUNT - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="grossAmount"
                        value={editForm.grossAmount}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-gray-500">
                        ₦{(income.grossAmount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  
                  {/* INCOME CENTRE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="incomeCentre"
                        value={editForm.incomeCentre}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter income centre"
                      />
                    ) : (
                      <span className={`${!income.incomeCentre ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {income.incomeCentre || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* PROJECT TYPE - Manually input */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="projectType"
                        value={editForm.projectType}
                        onChange={handleEditChange}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter project type"
                      />
                    ) : (
                      <span className={`${!income.projectType ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                        {income.projectType || 'Not set'}
                      </span>
                    )}
                  </td>
                  
                  {/* ACTIONS */}
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === income.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(income.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setNewRowId(null)
                            // If this was a new row being edited and cancelled, remove it
                            if (newRowId === income.id) {
                              handleDelete(income.id)
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
                          onClick={() => handleEdit(income)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
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
                <td colSpan={15} className="px-6 py-4 text-center text-gray-500">
                  {incomeData.length === 0 ? 'No income records. Click "Add Income" to get started.' : 'No records match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  )
}

export default IncomeModule