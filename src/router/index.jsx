import { createBrowserRouter } from 'react-router-dom'

import HomePage from '../pages/Home'
import AboutPage from '../pages/About'
import NotFoundPage from '../pages/NotFound'
import MainLayout from '../layouts/MainLayout'

export const router = createBrowserRouter([
   {
      path: '/',
      element: <MainLayout />,
      children: [
      {
         index: true,
         element: <HomePage />,
      },
      {
         path: 'about',
         element: <AboutPage />,
      },
      ],
   },
   {
      path: '*',
      element: <NotFoundPage />,
   },
])