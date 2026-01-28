import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

const ReportsModule = () => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [loading, setLoading] = useState(false)

  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    incomeByMonth: [],
    expensesByMonth: [],
    monthlyComparison: []
  })

  useEffect(() => {
    fetchReport()
  }, [dateRange])

  const fetchReport = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)

      const res = await fetch(
        `http://localhost:7000/api/finance/report?${params.toString()}`
      )
      const data = await res.json()

      // ✅ normalize backend string numbers
      setReportData({
        totalIncome: Number(data.totalIncome),
        totalExpenses: Number(data.totalExpenses),
        netProfitLoss: Number(data.netProfitLoss),
        incomeByMonth: data.incomeByMonth.map(i => ({
          ...i,
          income: Number(i.income)
        })),
        expensesByMonth: data.expensesByMonth.map(e => ({
          ...e,
          expenses: Number(e.expenses)
        })),
        monthlyComparison: data.monthlyComparison.map(m => ({
          ...m,
          income: Number(m.income),
          expenses: Number(m.expenses),
          profitLoss: Number(m.profitLoss)
        }))
      })
    } catch (err) {
      console.error('Failed to load report', err)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        'Report Type': 'Financial Summary',
        'Total Income': `₦${reportData.totalIncome.toLocaleString()}`,
        'Total Expenses': `₦${reportData.totalExpenses.toLocaleString()}`,
        'Net Profit/Loss': `₦${reportData.netProfitLoss.toLocaleString()}`
      },
      {},
      ...reportData.monthlyComparison.map(item => ({
        Month: item.month,
        Income: `₦${item.income.toLocaleString()}`,
        Expenses: `₦${item.expenses.toLocaleString()}`,
        'Profit/Loss': `₦${item.profitLoss.toLocaleString()}`
      }))
    ])

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report')
    XLSX.writeFile(
      workbook,
      `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }

  if (loading) {
    return <div className="p-6 text-center">Loading report…</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Financial Reports</h2>

        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
            className="border px-3 py-2 rounded"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Income" value={reportData.totalIncome} color="green" />
        <SummaryCard title="Total Expenses" value={reportData.totalExpenses} color="red" />
        <SummaryCard title="Net Profit/Loss" value={reportData.netProfitLoss} color="blue" />
      </div>

      {/* Monthly Comparison */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Month</th>
              <th className="px-4 py-2 text-left">Income</th>
              <th className="px-4 py-2 text-left">Expenses</th>
              <th className="px-4 py-2 text-left">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {reportData.monthlyComparison.map(row => (
              <tr key={row.month} className="border-b">
                <td className="px-4 py-2">{row.month}</td>
                <td className="px-4 py-2 text-green-600">
                  ₦{row.income.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-red-600">
                  ₦{row.expenses.toLocaleString()}
                </td>
                <td
                  className={`px-4 py-2 font-medium ${
                    row.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}
                >
                  ₦{row.profitLoss.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ✅ Tailwind-safe color mapping */
const colorMap = {
  green: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-600',
    title: 'text-green-800'
  },
  red: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-600',
    title: 'text-red-800'
  },
  blue: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-600',
    title: 'text-blue-800'
  }
}

const SummaryCard = ({ title, value, color }) => {
  const styles = colorMap[color]

  return (
    <div className={`p-6 rounded-lg border ${styles.bg}`}>
      <h3 className={`text-lg font-semibold mb-2 ${styles.title}`}>
        {title}
      </h3>
      <p className={`text-3xl font-bold ${styles.text}`}>
        ₦{value.toLocaleString()}
      </p>
    </div>
  )
}

export default ReportsModule
