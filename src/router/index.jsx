import { Navigate, createBrowserRouter } from 'react-router-dom'

import HomePage from '../pages/Home'
import AboutPage from '../pages/About'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import NotFoundPage from '../pages/NotFound'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from './guards/ProtectedRoute'
import PublicOnlyRoute from './guards/PublicOnlyRoute'

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
                  path: 'about',
                  element: <AboutPage />,
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