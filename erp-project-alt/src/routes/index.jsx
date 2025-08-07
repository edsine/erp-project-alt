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
        path: 'memos',
        element: <MemoList />,
      },
      {
        path: 'memos/new',
        element: <NewMemo />,
      },
      {
        path: 'requisitions',
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
        element: <NewClient />,
      },
      {
        path: 'files',
        element: <FileList />,
      },
      {
        path: 'files/:clientId',
        element: <ClientFileList />,
      },
      {
        path: 'files/:clientId/upload',
        element: <UploadFile />,
      },
      {
        path: 'files/:clientId/:fileId',
        element: <FileDetails />,
      },
      {
        path: 'files/edit-client/:clientId',
        element: <EditClient />,
      },
      {
        path: 'users',
        element: <UserList />,
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
    ],
  },
])

export default router

// Don't forget to update your DashboardLayout navigation links:
// - Change to="/dashboard" to to=""
// - Change to="/memos" to to="memos"  
// - Change to="/requisitions" to to="requisitions"
// - etc. 