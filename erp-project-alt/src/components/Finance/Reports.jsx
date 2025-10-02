import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const ReportsModule = ({ incomeData, expensesData }) => {
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    incomeByMonth: [],
    expensesByMonth: [],
    incomeByCategory: [],
    expensesByCategory: []
  })

  useEffect(() => {
    calculateReportData()
  }, [incomeData, expensesData, dateRange])

  const calculateReportData = () => {
    let filteredIncome = incomeData
    let filteredExpenses = expensesData

    if (dateRange.from && dateRange.to) {
      filteredIncome = filteredIncome.filter(item => {
        const itemDate = new Date(item.date)
        const fromDate = new Date(dateRange.from)
        const toDate = new Date(dateRange.to)
        return itemDate >= fromDate && itemDate <= toDate
      })

      filteredExpenses = filteredExpenses.filter(item => {
        const itemDate = new Date(item.date)
        const fromDate = new Date(dateRange.from)
        const toDate = new Date(dateRange.to)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    const totalIncome = filteredIncome.reduce((sum, item) => sum + item.income, 0)
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.spent, 0)
    const netProfit = totalIncome - totalExpenses

    // Calculate by month
    const incomeByMonth = calculateByMonth(filteredIncome, 'income')
    const expensesByMonth = calculateByMonth(filteredExpenses, 'spent')

    // Calculate by category
    const incomeByCategory = calculateByCategory(filteredIncome, 'income')
    const expensesByCategory = calculateByCategory(filteredExpenses, 'spent')

    setReportData({
      totalIncome,
      totalExpenses,
      netProfit,
      incomeByMonth,
      expensesByMonth,
      incomeByCategory,
      expensesByCategory
    })
  }

  const calculateByMonth = (data, amountField) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const result = months.map(month => ({
      month,
      amount: data.filter(item => item.month === month).reduce((sum, item) => sum + item[amountField], 0)
    }))
    return result.filter(item => item.amount > 0)
  }

  const calculateByCategory = (data, amountField) => {
    const categories = {}
    data.forEach(item => {
      if (item.category) {
        categories[item.category] = (categories[item.category] || 0) + item[amountField]
      }
    })
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount)
  }

  const exportReport = () => {
    const report = {
      dateRange,
      summary: {
        totalIncome: reportData.totalIncome,
        totalExpenses: reportData.totalExpenses,
        netProfit: reportData.netProfit
      },
      incomeByMonth: reportData.incomeByMonth,
      expensesByMonth: reportData.expensesByMonth,
      incomeByCategory: reportData.incomeByCategory,
      expensesByCategory: reportData.expensesByCategory
    }

    const worksheet = XLSX.utils.json_to_sheet([
      {
        'Report Type': 'Financial Summary',
        'Total Income': `₦${reportData.totalIncome.toLocaleString()}`,
        'Total Expenses': `₦${reportData.totalExpenses.toLocaleString()}`,
        'Net Profit/Loss': `₦${reportData.netProfit.toLocaleString()}`
      },
      {},
      ...reportData.incomeByMonth.map(item => ({
        'Month': item.month,
        'Income': `₦${item.amount.toLocaleString()}`,
        'Expenses': `₦${reportData.expensesByMonth.find(e => e.month === item.month)?.amount.toLocaleString() || '0'}`,
        'Profit/Loss': `₦${(item.amount - (reportData.expensesByMonth.find(e => e.month === item.month)?.amount || 0)).toLocaleString()}`
      }))
    ])
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report')
    XLSX.writeFile(workbook, `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Financial Reports</h2>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export Excel Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">₦{reportData.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">₦{reportData.totalExpenses.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-lg border ${
          reportData.netProfit >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            reportData.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'
          }`}>
            Net Profit/Loss
          </h3>
          <p className={`text-3xl font-bold ${
            reportData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            ₦{reportData.netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts and Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income by Month */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Income by Month</h3>
          <div className="space-y-3">
            {reportData.incomeByMonth.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(item.amount / Math.max(...reportData.incomeByMonth.map(i => i.amount), 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">₦{item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses by Month */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Expenses by Month</h3>
          <div className="space-y-3">
            {reportData.expensesByMonth.map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${(item.amount / Math.max(...reportData.expensesByMonth.map(i => i.amount), 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">₦{item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit/Loss</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.incomeByMonth.map((incomeItem) => {
                const expenseItem = reportData.expensesByMonth.find(e => e.month === incomeItem.month)
                const expenses = expenseItem ? expenseItem.amount : 0
                const profitLoss = incomeItem.amount - expenses
                
                return (
                  <tr key={incomeItem.month}>
                    <td className="px-4 py-3 text-sm font-medium">{incomeItem.month}</td>
                    <td className="px-4 py-3 text-sm text-green-600">₦{incomeItem.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-red-600">₦{expenses.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      ₦{profitLoss.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportsModule