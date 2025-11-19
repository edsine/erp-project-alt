import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const IncomeModule = ({ incomeData, setIncomeData, refreshData }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
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
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (id) => {
    try {
      setLoading(true)
      const incomeToUpdate = incomeData.find(income => income.id === id)
      
      const updatedData = {
        ...incomeToUpdate,
        ...editForm,
        income: Number(editForm.income) || 0,
        stampDuty: Number(editForm.stampDuty) || 0,
        wht: Number(editForm.wht) || 0,
        vat: Number(editForm.vat) || 0,
        grossAmount: Number(editForm.grossAmount) || 0,
        week: Number(editForm.week) || 1
      }

      // Update in backend
      const response = await fetch(`${BASE_URL}/finance/income/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        // Update local state
        setIncomeData(incomeData.map(income => {
          if (income.id === id) {
            return updatedData
          }
          return income
        }))
        setEditingId(null)
        refreshData() // Refresh all data
      } else {
        throw new Error('Failed to update income record')
      }
    } catch (error) {
      console.error('Error updating income:', error)
      alert('Error updating income record')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this income record?')) return

    try {
      setLoading(true)
      const response = await fetch(`${BASE_URL}/finance/income/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIncomeData(incomeData.filter(income => income.id !== id))
        refreshData() // Refresh all data
      } else {
        throw new Error('Failed to delete income record')
      }
    } catch (error) {
      console.error('Error deleting income:', error)
      alert('Error deleting income record')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = async () => {
    const newIncome = {
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(new Date().getDate() / 7),
      date: new Date().toISOString().split('T')[0],
      voucherCode: `INV-${Date.now()}`,
      transactionDetails: '',
      income: 0,
      stampDuty: 0,
      wht: 0,
      vat: 0,
      grossAmount: 0,
      incomeCentre: '',
      projectType: ''
    }

    try {
      setLoading(true)
      const response = await fetch(`${BASE_URL}/finance/income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIncome)
      })

      if (response.ok) {
        const savedIncome = await response.json()
        setIncomeData([...incomeData, { ...newIncome, id: savedIncome.id }])
        refreshData() // Refresh all data
      } else {
        throw new Error('Failed to create income record')
      }
    } catch (error) {
      console.error('Error creating income:', error)
      alert('Error creating income record')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          const importedData = jsonData.map((row) => ({
            day: String(row['DAY'] || row.Day || row.day || ''),
            month: String(row['MONTH'] || row.Month || row.month || ''),
            week: Number(row['WEEK'] || row.Week || row.week || 1),
            date: row['DATE'] || row.Date || row.date || new Date().toISOString().split('T')[0],
            voucherCode: String(row['VOUCHER CODE'] || row['Voucher Code'] || row.voucherCode || ''),
            transactionDetails: String(row['TRANSACTION DETAILS'] || row['Transaction Details'] || row.transactionDetails || ''),
            income: Number(row['INCOME'] || row.Income || row.income || 0),
            stampDuty: Number(row['STAMP DUTY'] || row['Stamp Duty'] || row.stampDuty || 0),
            wht: Number(row['WHT'] || row.Wht || row.wht || 0),
            vat: Number(row['VAT'] || row.Vat || row.vat || 0),
            grossAmount: Number(row['GROSS AMOUNT'] || row['Gross Amount'] || row.grossAmount || 0),
            incomeCentre: String(row['INCOME CENTRE'] || row['Income Centre'] || row.incomeCentre || ''),
            projectType: String(row['PROJECT TYPE'] || row['Project Type'] || row.projectType || ''),
          }))

          // Save to backend
          const response = await fetch(`${BASE_URL}/finance/income/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(importedData)
          })

          if (response.ok) {
            const savedData = await response.json()
            setIncomeData(prev => [...prev, ...savedData])
            refreshData() // Refresh all data
            event.target.value = ''
            alert(`Successfully imported ${importedData.length} income records!`)
          } else {
            throw new Error('Failed to import income data')
          }
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

  // CORRECTED: Total Income = Income - Stamp Duty
  const totalIncome = filteredData.reduce((sum, item) => sum + ((item.income || 0) - (item.stampDuty || 0)), 0)
  const totalGrossAmount = filteredData.reduce((sum, item) => sum + (item.grossAmount || 0), 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Loading...</p>
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
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">TOTAL INCOME (Income - Stamp Duty):</span>
          <span className="text-xl font-bold text-green-600">₦{totalIncome.toLocaleString()}</span>
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
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  
                  {/* Editable fields */}
                  {['day', 'month', 'week', 'date', 'voucherCode', 'transactionDetails', 'income', 'stampDuty', 'wht', 'vat', 'grossAmount', 'incomeCentre', 'projectType'].map((field) => (
                    <td key={field} className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {editingId === income.id ? (
                        field === 'month' ? (
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
                        ) : field === 'date' ? (
                          <input
                            type="date"
                            name="date"
                            value={editForm.date}
                            onChange={handleEditChange}
                            className="w-32 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        ) : ['income', 'stampDuty', 'wht', 'vat', 'grossAmount'].includes(field) ? (
                          <input
                            type="number"
                            name={field}
                            value={editForm[field]}
                            onChange={handleEditChange}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                            min="0"
                            step="0.01"
                          />
                        ) : field === 'week' ? (
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
                          <input
                            type="text"
                            name={field}
                            value={editForm[field]}
                            onChange={handleEditChange}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        )
                      ) : (
                        field === 'date' ? income[field] || '' :
                        ['income', 'stampDuty', 'wht', 'vat', 'grossAmount'].includes(field) 
                          ? `₦${(income[field] || 0).toLocaleString()}`
                          : income[field] || ''
                      )}
                    </td>
                  ))}
                  
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === income.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(income.id)}
                          className="text-blue-600 hover:text-blue-900"
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
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
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