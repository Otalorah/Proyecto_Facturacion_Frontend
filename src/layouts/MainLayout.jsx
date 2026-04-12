import { Link, NavLink, Outlet } from 'react-router-dom'
import './main-layout.css'

function MainLayout() {
   return (
      <div className="layout-shell">
      <header className="layout-header">
         <Link className="brand" to="/">
            FacturaApp
         </Link>
         <nav className="layout-nav" aria-label="Navegacion principal">
            <NavLink to="/" end>
            Inicio
            </NavLink>
            <NavLink to="/about">Acerca</NavLink>
         </nav>
      </header>

      <main className="layout-main">
         <Outlet />
      </main>
      </div>
   )
}

export default MainLayout