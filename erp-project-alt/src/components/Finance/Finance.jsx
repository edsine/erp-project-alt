import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import IncomeModule from './Income'
import ExpensesModule from './Expenses'
import ReportsModule from './Reports'

const FinancialDashboard = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState('income')
  const [incomeData, setIncomeData] = useState([])
  const [expensesData, setExpensesData] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Fetch all financial data on component mount
  useEffect(() => {
    fetchFinancialData()
  }, [])

// In FinancialDashboard component, update the fetchFinancialData function:
const fetchFinancialData = async () => {
  try {
    setLoading(true)
    await Promise.all([
      fetchIncomeData(),
      fetchExpensesData()
    ])
  } catch (error) {
    console.error('Error fetching financial data:', error)
  } finally {
    setLoading(false)
  }
}

const fetchExpensesData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/finance/expenses`)
    if (response.ok) {
      const data = await response.json()
      setExpensesData(data)
    }
  } catch (error) {
    console.error('Error fetching expenses data:', error)
  }
}

  const fetchIncomeData = async () => {
    try {
      const response = await fetch('/finance/income')
      if (response.ok) {
        const data = await response.json()
        setIncomeData(data)
      }
    } catch (error) {
      console.error('Error fetching income data:', error)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-pulse text-lg">Loading financial data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-9xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Manage your income, expenses, and view financial reports</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'income', name: 'Income' },
                { id: 'expenses', name: 'Expenses' },
                { id: 'reports', name: 'Reports' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'income' && (
            <IncomeModule 
              incomeData={incomeData}
              setIncomeData={setIncomeData}
              refreshData={fetchFinancialData}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesModule 
              expensesData={expensesData}
              setExpensesData={setExpensesData}
              refreshData={fetchFinancialData}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsModule 
              incomeData={incomeData}
              expensesData={expensesData}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default FinancialDashboard