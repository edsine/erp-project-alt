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
import RequireAccess from '../components/Auth/RequireAccess'
import { hasFilesAccess, hasUsersAccess } from '../utils/accessControl'
// import SingleMemo from '../components/Memo/Singlememo'

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
      {
        path: 'files/new-client',
        element: <RequireAccess check={hasFilesAccess}><NewClient /></RequireAccess>,
      },
      {
        path: 'files',
        element: <RequireAccess check={hasFilesAccess}><FileList /></RequireAccess>,
      },
      {
        path: 'files/:clientId',
        element: <RequireAccess check={hasFilesAccess}><ClientFileList /></RequireAccess>,
      },
      {
        path: 'files/:clientId/upload',
        element: <RequireAccess check={hasFilesAccess}><UploadFile /></RequireAccess>,
      },
      {
        path: 'files/:clientId/:fileId',
        element: <RequireAccess check={hasFilesAccess}><FileDetails /></RequireAccess>,
      },
      {
        path: 'files/edit-client/:clientId',
        element: <RequireAccess check={hasFilesAccess}><EditClient /></RequireAccess>,
      },
      {
        path: 'users',
        element: <RequireAccess check={hasUsersAccess}><UserList /></RequireAccess>,
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