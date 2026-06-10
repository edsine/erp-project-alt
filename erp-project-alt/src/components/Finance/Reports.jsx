import { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const ReportsModule = () => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    incomeByMonth: [],
    expensesByMonth: [],
    monthlyComparison: []
  });

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/finance/report?${params.toString()}`);
      const data = await res.json();

      // Safely convert all numeric fields
      setReportData({
        totalIncome: Number(data.totalIncome) || 0,
        totalExpenses: Number(data.totalExpenses) || 0,
        netProfitLoss: Number(data.netProfitLoss) || 0,
        incomeByMonth: (data.incomeByMonth || []).map(i => ({ ...i, income: Number(i.income) || 0 })),
        expensesByMonth: (data.expensesByMonth || []).map(e => ({ ...e, expenses: Number(e.expenses) || 0 })),
        monthlyComparison: (data.monthlyComparison || []).map(m => ({
          month: m.month || 'Unknown',
          income: Number(m.income) || 0,
          expenses: Number(m.expenses) || 0,
          profitLoss: Number(m.profitLoss) || 0
        }))
      });
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { 'Report Type': 'Financial Summary',
        'Total Income': `₦${(reportData.totalIncome || 0).toLocaleString()}`,
        'Total Expenses': `₦${(reportData.totalExpenses || 0).toLocaleString()}`,
        'Net Profit/Loss': `₦${(reportData.netProfitLoss || 0).toLocaleString()}` },
      {},
      ...reportData.monthlyComparison.map(item => ({
        Month: item.month,
        Income: `₦${(item.income || 0).toLocaleString()}`,
        Expenses: `₦${(item.expenses || 0).toLocaleString()}`,
        'Profit/Loss': `₦${(item.profitLoss || 0).toLocaleString()}`
      }))
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    XLSX.writeFile(workbook, `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Additional metrics – safe even if monthlyComparison empty
  const metrics = useMemo(() => {
    const monthly = reportData.monthlyComparison;
    if (!monthly || monthly.length === 0) {
      return {
        avgIncome: 0,
        avgExpense: 0,
        profitMargin: 0,
        bestMonth: { month: 'N/A', profitLoss: 0 },
        worstMonth: { month: 'N/A', profitLoss: 0 }
      };
    }
    const incomes = monthly.map(m => m.income);
    const expenses = monthly.map(m => m.expenses);
    const profits = monthly.map(m => m.profitLoss);
    const bestMonth = monthly.reduce((best, curr) => curr.profitLoss > best.profitLoss ? curr : best, monthly[0]);
    const worstMonth = monthly.reduce((worst, curr) => curr.profitLoss < worst.profitLoss ? curr : worst, monthly[0]);
    const avgIncome = incomes.reduce((a,b) => a+b, 0) / incomes.length;
    const avgExpense = expenses.reduce((a,b) => a+b, 0) / expenses.length;
    const profitMargin = reportData.totalIncome > 0 ? (reportData.netProfitLoss / reportData.totalIncome) * 100 : 0;
    return { avgIncome, avgExpense, profitMargin, bestMonth, worstMonth };
  }, [reportData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading report...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
      {/* Header + Date Filter */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Financial Reports & Analytics</h2>
        <div className="flex gap-3">
          <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          <button onClick={exportReport} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition">Export Excel</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard title="Total Income" value={reportData.totalIncome} color="green" />
        <SummaryCard title="Total Expenses" value={reportData.totalExpenses} color="red" />
        <SummaryCard title="Net Profit/Loss" value={reportData.netProfitLoss} color="blue" />
        <SummaryCard title="Profit Margin" value={metrics.profitMargin} suffix="%" color="purple" isPercent />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Avg Monthly Income" value={metrics.avgIncome} />
        <MetricCard title="Avg Monthly Expense" value={metrics.avgExpense} />
        <MetricCard title="Best Month" subtitle={metrics.bestMonth.month} value={metrics.bestMonth.profitLoss} />
        <MetricCard title="Worst Month" subtitle={metrics.worstMonth.month} value={metrics.worstMonth.profitLoss} />
      </div>

      {/* Charts Grid – only if there is data */}
      {reportData.monthlyComparison.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income vs Expenses Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-md font-medium text-gray-700 mb-3">Income vs Expenses (Monthly)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Profit/Loss Line Chart */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-md font-medium text-gray-700 mb-3">Profit / Loss Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="profitLoss" stroke="#3b82f6" strokeWidth={2} name="Net Profit/Loss" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Expense Distribution (Pie) */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-md font-medium text-gray-700 mb-3">Expense Distribution by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={reportData.expensesByMonth} dataKey="expenses" nameKey="month" cx="50%" cy="50%" outerRadius={80} label>
                    {reportData.expensesByMonth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Income Trend Area Chart */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-md font-medium text-gray-700 mb-3">Income vs Expenses (Area)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Comparison Table */}
          <div className="overflow-x-auto">
            <h3 className="text-md font-medium text-gray-700 mb-3">Monthly Breakdown</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Month</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Income</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Expenses</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Profit/Loss</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.monthlyComparison.map(row => (
                  <tr key={row.month}><td className="px-4 py-3 text-sm font-medium">{row.month}</td><td className="px-4 py-3 text-sm text-green-600">₦{row.income.toLocaleString()}</td><td className="px-4 py-3 text-sm text-red-600">₦{row.expenses.toLocaleString()}</td><td className={`px-4 py-3 text-sm font-medium ${row.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₦{row.profitLoss.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">No data available for the selected period.</div>
      )}
    </div>
  );
};

// Helper Components with safe number handling
const SummaryCard = ({ title, value, color, suffix = '', isPercent = false }) => {
  const safeValue = Number(value) || 0;
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };
  const displayValue = isPercent ? `${safeValue.toFixed(1)}%` : `₦${safeValue.toLocaleString()}`;
  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold">{displayValue}{!isPercent && suffix}</p>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle }) => {
  const safeValue = Number(value) || 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-gray-800">₦{safeValue.toLocaleString()}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default ReportsModule;