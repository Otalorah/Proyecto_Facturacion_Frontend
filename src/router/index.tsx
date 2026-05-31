import { Navigate, createBrowserRouter } from 'react-router-dom'

import HomePage from '../pages/Home'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import ForgotPasswordPage from '../pages/ForgotPassword'
import ResetPasswordPage from '../pages/ResetPassword'
import NotFoundPage from '../pages/NotFound'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from './guards/ProtectedRoute'
import PublicOnlyRoute from './guards/PublicOnlyRoute'
import UsersPage from '../pages/Users'
import AlertsPage from '../pages/Alerts'
import AccountPage from '../pages/Account'
import ClientsPage from '../pages/Clients'
import ClientDetailPage from '../pages/Clients/detail'
import SalesPage from '../pages/Sales'
import SalesDetailPage from '../pages/Sales/detail'
import InvoicesPage from '../pages/Invoices'
import InvoiceDetailPage from '../pages/Invoices/detail'
import PaymentsPage from '../pages/Payments'
import PaymentDetailPage from '../pages/Payments/detail'
import AuditPage from '../pages/Audit'

export const router = createBrowserRouter([
   {
      path: '/login',
      element: <PublicOnlyRoute />,
      children: [
         {
            index: true,
            element: <LoginPage />,
         },
      ],
   },
   {
      path: '/register',
      element: <PublicOnlyRoute />,
      children: [
         {
            index: true,
            element: <RegisterPage />,
         },
      ],
   },
   {
      path: '/forgot-password',
      element: <PublicOnlyRoute />,
      children: [
         {
            index: true,
            element: <ForgotPasswordPage />,
         },
      ],
   },
   {
      path: '/reset-password',
      element: <PublicOnlyRoute />,
      children: [
         {
            index: true,
            element: <ResetPasswordPage />,
         },
      ],
   },
   {
      path: '/',
      element: <ProtectedRoute />,
      children: [
         {
            index: true,
            element: <Navigate to="/dashboard" replace />,
         },
         {
            element: <MainLayout />,
            children: [
               {
                  path: 'dashboard',
                  element: <HomePage />,
               },
               {
                  path: 'alerts',
                  element: <AlertsPage />,
               },
               {
                  path: 'users',
                  element: <UsersPage />,
               },
               {
                  path: 'clients',
                  element: <ClientsPage />,
               },
               {
                  path: 'clients/:id',
                  element: <ClientDetailPage />,
               },
               {
                  path: 'sales',
                  element: <SalesPage />,
               },
               {
                  path: 'sales/:id',
                  element: <SalesDetailPage />,
               },
               {
                  path: 'invoices',
                  element: <InvoicesPage />,
               },
               {
                  path: 'invoices/:id',
                  element: <InvoiceDetailPage />,
               },
               {
                  path: 'payments',
                  element: <PaymentsPage />,
               },
               {
                  path: 'payments/:id',
                  element: <PaymentDetailPage />,
               },
               {
                  path: 'audit',
                  element: <AuditPage />,
               },
               {
                  path: 'account',
                  element: <AccountPage />,
               },
            ],
         },
      ],
   },
   {
      path: '*',
      element: <NotFoundPage />,
   },
])