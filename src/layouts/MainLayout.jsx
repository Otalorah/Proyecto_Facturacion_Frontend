import { Link, NavLink, Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuth } from '../auth/useAuth'
import './main-layout.css'

function MainLayout() {
   const { logout } = useAuth()

   return (
      <div className="layout-shell">
         <header className="layout-header">
            <Link className="brand" to="/dashboard">
               FacturaApp
            </Link>
            <nav className="layout-nav" aria-label="Navegacion principal">
               <NavLink to="/dashboard" end>
                  Dashboard
               </NavLink>
               <NavLink to="/about">Acerca</NavLink>
            </nav>
            <Button type="button" variant="secondary" onClick={logout}>
               Cerrar sesion
            </Button>
         </header>

         <main className="layout-main">
            <Outlet />
         </main>
      </div>
   )
}

export default MainLayout