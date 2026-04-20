import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../auth/useAuth'
import { loginRequest } from '../../services/auth-service'
import styles from './styles.module.css'

function LoginPage() {
   useDocumentTitle('Iniciar sesion')

   const navigate = useNavigate()
   const location = useLocation()
   const { setAuthToken } = useAuth()

   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   const destination = location.state?.from?.pathname || '/dashboard'

   async function handleSubmit(event) {
      event.preventDefault()
      setError('')
      setIsSubmitting(true)

      try {
         const { token } = await loginRequest({ email, password })

         if (!token) {
            throw new Error('La respuesta no incluye token JWT.')
         }

         setAuthToken(token)
         navigate(destination, { replace: true })
      } catch (requestError) {
         setError(requestError.message || 'No se pudo iniciar sesion.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <h1>Iniciar sesion</h1>
         <p>Accede para gestionar productos e inventario.</p>

         <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="email">Correo</label>
            <Input
               id="email"
               type="email"
               autoComplete="email"
               value={email}
               onChange={(event) => setEmail(event.target.value)}
               placeholder="correo@empresa.com"
               required
            />

            <label htmlFor="password">Contrasena</label>
            <Input
               id="password"
               type="password"
               autoComplete="current-password"
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               placeholder="********"
               required
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? 'Ingresando...' : 'Entrar'}
            </Button>
         </form>

         <p>
            No tienes cuenta? <Link to="/register">Registrate</Link>
         </p>
      </section>
   )
}

export default LoginPage
