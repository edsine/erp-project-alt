import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const IncomeModule = () => {
  const [incomeData, setIncomeData] = useState([])
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
    income: '',
    duty: '',
    wht: '',
    vat: '',
    grossAmount: '',
    incomeCentre: '',
    type: '',
    stamp: '',
    project: ''
  })

  // Sample initial data matching your format
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        day: '15',
        month: 'JAN',
        week: 3,
        voucher: 'INV-001',
        transactionDetails: 'Client Payment - Project Alpha',
        income: 500000,
        duty: 5000,
        wht: 25000,
        vat: 75000,
        grossAmount: 575000,
        incomeCentre: 'Operations',
        type: 'Service',
        stamp: 'Yes',
        project: 'Project Alpha',
        date: '2024-01-15'
      },
      {
        id: 2,
        day: '22',
        month: 'JAN',
        week: 4,
        voucher: 'INV-002',
        transactionDetails: 'Consulting Fees',
        income: 250000,
        duty: 2500,
        wht: 12500,
        vat: 37500,
        grossAmount: 287500,
        incomeCentre: 'Professional Services',
        type: 'Consulting',
        stamp: 'Yes',
        project: 'Advisory Project',
        date: '2024-01-22'
      }
    ]
    setIncomeData(sampleData)
    setFilteredData(sampleData)
  }, [])

  // Filter data based on search and date range
  useEffect(() => {
    let filtered = incomeData

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transactionDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.project.toLowerCase().includes(searchTerm.toLowerCase())
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
      day: income.day,
      month: income.month,
      week: income.week,
      voucher: income.voucher,
      transactionDetails: income.transactionDetails,
      income: income.income,
      duty: income.duty,
      wht: income.wht,
      vat: income.vat,
      grossAmount: income.grossAmount,
      incomeCentre: income.incomeCentre,
      type: income.type,
      stamp: income.stamp,
      project: income.project
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
    setIncomeData(incomeData.map(income => {
      if (income.id === id) {
        const updatedIncome = {
          ...income,
          ...editForm,
          income: Number(editForm.income),
          duty: Number(editForm.duty),
          wht: Number(editForm.wht),
          vat: Number(editForm.vat),
          grossAmount: Number(editForm.grossAmount),
          week: Number(editForm.week)
        }
        return updatedIncome
      }
      return income
    }))
    setEditingId(null)
  }

  const handleDelete = (id) => {
    setIncomeData(incomeData.filter(income => income.id !== id))
  }

  const handleAddNew = () => {
    const newIncome = {
      id: Date.now(),
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
      week: Math.ceil(new Date().getDate() / 7),
      voucher: `INV-${Date.now()}`,
      transactionDetails: '',
      income: 0,
      duty: 0,
      wht: 0,
      vat: 0,
      grossAmount: 0,
      incomeCentre: '',
      type: '',
      stamp: 'No',
      project: '',
      date: new Date().toISOString().split('T')[0]
    }
    setIncomeData([...incomeData, newIncome])
    setEditingId(newIncome.id)
    setEditForm({
      day: newIncome.day,
      month: newIncome.month,
      week: newIncome.week,
      voucher: newIncome.voucher,
      transactionDetails: '',
      income: '',
      duty: '',
      wht: '',
      vat: '',
      grossAmount: '',
      incomeCentre: '',
      type: '',
      stamp: 'No',
      project: ''
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
          
          // Map Excel columns to our data structure
          const importedData = jsonData.map((row, index) => ({
            id: Date.now() + index,
            day: row.Day || '',
            month: row.Month || '',
            week: row.Week || 1,
            voucher: row.Voucher || '',
            transactionDetails: row['Transaction Details'] || '',
            income: Number(row.Income) || 0,
            duty: Number(row.Duty) || 0,
            wht: Number(row.WHT) || 0,
            vat: Number(row.VAT) || 0,
            grossAmount: Number(row['Gross Amount']) || 0,
            incomeCentre: row['Income Centre'] || '',
            type: row.Type || '',
            stamp: row.Stamp || 'No',
            project: row.Project || '',
            date: row.Date || new Date().toISOString().split('T')[0]
          }))
          
          setIncomeData([...incomeData, ...importedData])
        } catch (error) {
          console.error('Error parsing Excel file:', error)
          alert('Error importing file. Please check the format.')
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(incomeData.map(item => ({
      'Day': item.day,
      'Month': item.month,
      'Week': item.week,
      'Voucher': item.voucher,
      'Transaction Details': item.transactionDetails,
      'Income': item.income,
      'Duty': item.duty,
      'WHT': item.wht,
      'VAT': item.vat,
      'Gross Amount': item.grossAmount,
      'Income Centre': item.incomeCentre,
      'Type': item.type,
      'Stamp': item.stamp,
      'Project': item.project,
      'Date': item.date
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income Data')
    XLSX.writeFile(workbook, 'income_data.xlsx')
  }

  const totalIncome = filteredData.reduce((sum, item) => sum + item.income, 0)
  const totalGrossAmount = filteredData.reduce((sum, item) => sum + item.grossAmount, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">ANNUAL INCOME</h2>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search income records..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Add Income
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

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">TOTAL INCOME:</span>
          <span className="text-xl font-bold text-green-600">₦{totalIncome.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-semibold">TOTAL GROSS AMOUNT:</span>
          <span className="text-xl font-bold text-blue-600">₦{totalGrossAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">S/N</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">TRANSACTION DETAILS</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">INCOME</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DUTY</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">WHT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">GROSS AMOUNT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">INCOME CENTRE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">TYPE</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">STAMP</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">PROJECT</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((income, index) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="day"
                        value={editForm.day}
                        onChange={handleEditChange}
                        className="w-12 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.day
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
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
                      income.month
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
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
                      income.week
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="voucher"
                        value={editForm.voucher}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.voucher
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="transactionDetails"
                        value={editForm.transactionDetails}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.transactionDetails
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="income"
                        value={editForm.income}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${income.income.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="duty"
                        value={editForm.duty}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${income.duty.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="wht"
                        value={editForm.wht}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${income.wht.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="vat"
                        value={editForm.vat}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${income.vat.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                    {editingId === income.id ? (
                      <input
                        type="number"
                        name="grossAmount"
                        value={editForm.grossAmount}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      `₦${income.grossAmount.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="incomeCentre"
                        value={editForm.incomeCentre}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.incomeCentre
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="type"
                        value={editForm.type}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.type
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <select
                        name="stamp"
                        value={editForm.stamp}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      income.stamp
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {editingId === income.id ? (
                      <input
                        type="text"
                        name="project"
                        value={editForm.project}
                        onChange={handleEditChange}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    ) : (
                      income.project
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === income.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(income.id)}
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
                          onClick={() => handleEdit(income)}
                          className="text-primary hover:text-primary-dark"
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
                <td colSpan="16" className="px-6 py-4 text-center text-gray-500">
                  No income records found
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