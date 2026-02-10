import { createBrowserRouter } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../components/Auth/Login'
import Register from '../components/Auth/Register'
import Dashboard from '../pages/Dashboard'
import MemoList from '../components/Memo/MemoList'
import NewMemo from '../components/Memo/NewMemo'
import RequisitionList from '../components/Requisition/RequisitionList'
import NewRequisition from '../components/Requisition/NewRequisition'
import LeaveList from '../components/Leave/LeaveList'
import NewLeave from '../components/Leave/NewLeave'
import PayrollList from '../components/Payroll/PayrollList'
import TaskList from '../components/Tasks/TaskList'
import UserList from '../components/Users/UserList'
import FileList from '../components/Files/FileList'
import ClientFileList from '../components/Files/ClientFileList'
import UploadFile from '../components/Files/UploadFile'
import FileDetails from '../components/Files/FileDetails'
import NewClient from '../components/Files/NewClient'
import EditClient from '../components/Files/EditClient'
import ActivitiesPage from '../components/Activities/ActivitiesPage'
import DirectMemos from '../components/DirectMemo/DirectMemoList'
import NewDirectMemo from '../components/DirectMemo/NewDirectMemos'
import IncomeModule from '../components/Finance/Income'
import ExpensesModule from '../components/Finance/Expenses'
import ReportsModule from '../components/Finance/Reports'
import FinancialDashboard from '../components/Finance/Finance'
import ChangePassword from '../components/Settings/ChangePassword'
// import ProtectedRoute from '../components/Auth/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true, // This makes it the default child route
        element: <Dashboard />,
      },
      {
        path: 'memos/:memoId?',
        element: <MemoList/>,
      },
      {
        path: 'memos/new',
        element: <NewMemo />,
      },

      {
        path: 'requisitions/:requisitionId?',
        element: <RequisitionList />,
      },
      {
        path: 'requisitions/new',
        element: <NewRequisition />,
      },
      {
        path: 'tasks',
        element: <TaskList />,
      },
      // Client File Routes - Protected for Chairman, GMD, Finance roles AND Admin Department
      {
        path: 'files/new-client',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <NewClient />
          </ProtectedRoute>
        ),
      },
      {
        path: 'files',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <FileList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'files/:clientId',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <ClientFileList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'files/:clientId/upload',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <UploadFile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'files/:clientId/:fileId',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <FileDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: 'files/edit-client/:clientId',
        element: (
          <ProtectedRoute 
            allowedRoles={['chairman', 'gmd', 'finance']}
            allowedDepartments={['Admin']}
            requireAllConditions={true}
          >
            <EditClient />
          </ProtectedRoute>
        ),
      },
 // UserList Route - Protected for Chairman, HR, and Admin roles
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={['chairman', 'hr', 'admin']}>
            <UserList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leaves',
        element: <LeaveList />,
      },
      {
        path: 'leaves/new',
        element: <NewLeave />,
      },
      {
        path: 'payroll',
        element: <PayrollList />,
      },
      {
        path: 'notifications',
        element: <ActivitiesPage />,
      },
      {
        path: 'direct-memos',
        element: <DirectMemos />
      },
      {
        path: 'direct-memos/new',
        element: <NewDirectMemo />
      },
      {
        path: 'finance',
        element: <FinancialDashboard />,
      },
      {
        path: 'finance/income',
        element: <IncomeModule />,
      },
      {
        path: 'finance/expenses',
        element: <ExpensesModule />,
      },
      {
        path: 'finance/reports',
        element: <ReportsModule />,
      },
      {
        path: 'settings/change-password',
        element: <ChangePassword />,
      }
    ],
  },
])

export default router

// Don't forget to update your DashboardLayout navigation links:
// - Change to="/dashboard" to to=""
// - Change to="/memos" to to="memos"
// - Change to="/requisitions" to to="requisitions"
// - etc. 