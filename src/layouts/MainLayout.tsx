import { Link, NavLink, Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuth } from '../auth/useAuth'
import { logoutRequest } from '../services/auth-service'
import './main-layout.css'

function MainLayout() {
   const { logout } = useAuth()

   async function handleLogout() {
      try {
         await logoutRequest()
      } catch {
         // Ignore API logout failures, still clear local session.
      } finally {
         logout()
      }
   }

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
               <NavLink to="/users">Usuarios</NavLink>
               <NavLink to="/clients">Clientes</NavLink>
               <NavLink to="/sales">Ventas</NavLink>
               <NavLink to="/invoices">Facturas</NavLink>
               <NavLink to="/payments">Pagos</NavLink>
               <NavLink to="/alerts">Alertas</NavLink>
               <NavLink to="/audit">Auditoria</NavLink>
               <NavLink to="/account">Mi cuenta</NavLink>
            </nav>
            <Button type="button" variant="secondary" onClick={handleLogout}>
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