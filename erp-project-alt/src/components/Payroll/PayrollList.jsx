import { useState } from 'react'

const PayrollList = () => {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'John Doe',
      department: 'IT',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      basicSalary: 5000,
      deductions: 500,
      bonuses: 300,
      netSalary: 4800,
      status: 'paid',
    },
    {
      id: 2,
      name: 'Jane Smith',
      department: 'HR',
      bankName: 'Bank of America',
      accountNumber: '****5678',
      basicSalary: 4500,
      deductions: 200,
      bonuses: 0,
      netSalary: 4300,
      status: 'paid',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      department: 'Finance',
      bankName: 'Wells Fargo',
      accountNumber: '****9012',
      basicSalary: 6000,
      deductions: 0,
      bonuses: 500,
      netSalary: 6500,
      status: 'pending',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    deductions: 0,
    bonuses: 0,
    reason: ''
  })

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (employee) => {
    setEditingId(employee.id)
    setEditForm({
      deductions: employee.deductions,
      bonuses: employee.bonuses,
      reason: ''
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'deductions' || name === 'bonuses' ? Number(value) : value
    }))
  }

  const handleSave = (id) => {
    setEmployees(employees.map(employee => {
      if (employee.id === id) {
        const netSalary = employee.basicSalary - editForm.deductions + editForm.bonuses
        return {
          ...employee,
          deductions: editForm.deductions,
          bonuses: editForm.bonuses,
          netSalary,
          status: netSalary !== employee.netSalary ? 'pending' : employee.status
        }
      }
      return employee
    }))
    setEditingId(null)
  }

  const handlePay = (id) => {
    setEmployees(employees.map(employee => 
      employee.id === id ? { ...employee, status: 'paid' } : employee
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Payroll Management</h2>
        <div className="w-64">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Basic Salary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bonuses
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Salary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{employee.bankName}</div>
                    <div>{employee.accountNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${employee.basicSalary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === employee.id ? (
                      <input
                        type="number"
                        name="deductions"
                        value={editForm.deductions}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                      />
                    ) : (
                      `$${employee.deductions.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === employee.id ? (
                      <input
                        type="number"
                        name="bonuses"
                        value={editForm.bonuses}
                        onChange={handleEditChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                        min="0"
                      />
                    ) : (
                      `$${employee.bonuses.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${employee.netSalary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === employee.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleSave(employee.id)}
                          className="text-primary hover:text-primary"
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
                          onClick={() => handleEdit(employee)}
                          className="text-primary hover:text-primary"
                        >
                          Edit
                        </button>
                        {employee.status === 'pending' && (
                          <button
                            onClick={() => handlePay(employee.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="mt-6 p-4 border border-gray-200 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Reason for Deduction/Bonus</h3>
          <textarea
            name="reason"
            value={editForm.reason}
            onChange={handleEditChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Provide reason for any deductions or bonuses"
          />
        </div>
      )}
    </div>
  )
}

export default PayrollList