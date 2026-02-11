import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx';






const IncomeModule = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL
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
  const [incomeData, setIncomeData] = useState([])

  // Save to localStorage whenever incomeData changes



  const loadIncome = async () => {
    try {
      setLoading(true)

      // const res = await fetch(`${BASE_URL}/finance/income`)
      const res = await fetch(`${BASE_URL}/finance/income/table`)
      if (!res.ok) throw new Error('Fetch failed')

      const data = await res.json()

      const mapped = data.map(item => {
        const dateObj = new Date(item.transaction_date)
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
        }
      })

      setIncomeData(mapped)
      setFilteredData(mapped)
    } catch (err) {
      console.error('LOAD INCOME ERROR:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncome()
  }, [])




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

//   const handleSave = async (id) => {
//   try {
//     setLoading(true)

//     const payload = {
//       transactionDate: editForm.date,
//       voucherNo: editForm.voucherCode,
//       transactionDetails: editForm.transactionDetails,
//       income: Number(editForm.income) || 0,
//       stamp: Number(editForm.stampDuty) || 0,
//       wht: Number(editForm.wht) || 0,
//       vat: Number(editForm.vat) || 0,
//       incomeCentre: editForm.incomeCentre,
//       projectType: editForm.projectType,
//       project: '',
//       createdBy: 1,
//     }

//     const isNew = id === '__new__'

//     const res = await fetch(
//       isNew
//         ? `${BASE_URL}/finance/income`
//         : `${BASE_URL}/finance/income/${id}`,
//       {
//         method: isNew ? 'POST' : 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       }
//     )

//     if (!res.ok) {
//       throw new Error(`${isNew ? 'POST' : 'PUT'} failed`)
//     }

//     // 🔁 Always reload from DB (authoritative source)
//     await loadIncome()

//     setEditingId(null)
//     setNewRowId(null)

//   } catch (err) {
//     console.error('SAVE ERROR:', err)
//     alert('Failed to save income')
//   } finally {
//     setLoading(false)
//   }
// }

const handleSave = async (id) => {
  try {
    setLoading(true)

    const isNew = id === '__new__'

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
      ...(isNew && { createdBy: 1 })   // ✅ ONLY for POST
    }

    const res = await fetch(
      isNew
        ? `${BASE_URL}/finance/income`
        : `${BASE_URL}/finance/income/${id}`,
      {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg)
    }

    await loadIncome()
    setEditingId(null)

  } catch (err) {
    console.error('SAVE ERROR:', err)
    alert('Failed to save income')
  } finally {
    setLoading(false)
  }
}





  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this income record?')) return

    try {
      setLoading(true)

      const res = await fetch(`${BASE_URL}/finance/income/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error(`DELETE failed: ${res.status}`)
      }

      setIncomeData(prev => prev.filter(row => row.id !== id))
      setFilteredData(prev => prev.filter(row => row.id !== id))

      setEditingId(null)
      setNewRowId(null)

    } catch (err) {
      console.error('DELETE ERROR:', err)
      alert('Failed to delete income')
    } finally {
      setLoading(false)
    }
  }


const handleAddNew = () => {
  if (editingId) return   // prevent multiple new rows

  const today = new Date().toISOString().split('T')[0]
  const dateObj = new Date(today)

  const newRow = {
    id: '__new__',                 // temp ID
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
    grossAmount: 0,                // display-only
    incomeCentre: '',
    projectType: '',
  }

  setIncomeData(prev => [newRow, ...prev])
  setFilteredData(prev => [newRow, ...prev])
  setEditForm(newRow)
  setEditingId('__new__')
}




  const handleImport = async (event) => {
    const file = event.target.files[0]
    event.target.value = ''   // 🔥 reset immediately
    if (!file) return

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${BASE_URL}/finance/income/import`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const result = await res.json()
      alert(`Imported ${result.inserted} record(s)`)

      // 🔁 reload table without full refresh
      await loadIncome()
    } catch (err) {
      console.error('IMPORT ERROR:', err)
      alert('Failed to import Excel file')
    } finally {
      setLoading(false)
    }
  }



  const handleExport = () => {
    window.location.href = `${BASE_URL}/finance/income/download`
  }


  const handleClearAll = () => {
    setSearchTerm('')
    setDateRange({ from: '', to: '' })
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
            type="button"   // ✅ IMPORTANT
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
            {filteredData.map((income, index) => (
              <tr key={income.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 text-sm">{index + 1}</td>

                {[
                  'day',
                  'month',
                  'week',
                  'date',
                  'voucherCode',
                  'transactionDetails',
                  'income',
                  'stampDuty',
                  'wht',
                  'vat',
                  'grossAmount',
                  'incomeCentre',
                  'projectType'
                ].map(field => (
                  <td key={field} className="px-3 py-3 text-sm">
                    {editingId === income.id ? (
                      <input
                        type={['income', 'stampDuty', 'wht', 'vat'].includes(field) ? 'number' : 'text'}
                        name={field}
                        value={editForm[field]}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      ['income', 'stampDuty', 'wht', 'vat', 'grossAmount'].includes(field)
                        ? `₦${(income[field] || 0).toLocaleString()}`
                        : income[field]
                    )}
                  </td>
                ))}

                <td className="px-3 py-3 text-right">
                  {editingId === income.id ? (
                    <>
                      <button
                        onClick={() => handleSave(income.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(income)}
                        className="px-3 py-1 bg-blue-600 text-white rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>


    </div>
  )
}

export default IncomeModule