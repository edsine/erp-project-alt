import { useState } from 'react'
import IncomeModule from './Income'
import ExpensesModule from './Expenses'
import ReportsModule from './Reports'

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('income')
  const [incomeData, setIncomeData] = useState([])
  const [expensesData, setExpensesData] = useState([])

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Manage your income, expenses, and view financial reports</p>
        </div>

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

        <div>
          {activeTab === 'income' && (
            <IncomeModule 
              incomeData={incomeData}
              setIncomeData={setIncomeData}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesModule 
              expensesData={expensesData}
              setExpensesData={setExpensesData}
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