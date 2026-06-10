// FinancialDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import IncomeModule from './Income';
import ExpensesModule from './Expenses';
import ReportsModule from './Reports';

const FinancialDashboard = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [activeTab, setActiveTab] = useState('income');
  const [incomeData, setIncomeData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchIncomeData(), fetchExpensesData()]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/finance/expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpensesData(data);
      }
    } catch (error) {
      console.error('Error fetching expenses data:', error);
    }
  };

  const fetchIncomeData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/finance/income`);
      if (response.ok) {
        const data = await response.json();
        setIncomeData(data);
      }
    } catch (error) {
      console.error('Error fetching income data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-pulse text-lg text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Financial Management</h1>
          <p className="text-gray-500 mt-1">Manage income, expenses, and view financial reports</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['income', 'expenses', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'income' && (
            <IncomeModule incomeData={incomeData} setIncomeData={setIncomeData} refreshData={fetchFinancialData} />
          )}
          {activeTab === 'expenses' && (
            <ExpensesModule expensesData={expensesData} setExpensesData={setExpensesData} refreshData={fetchFinancialData} />
          )}
          {activeTab === 'reports' && <ReportsModule incomeData={incomeData} expensesData={expensesData} />}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;