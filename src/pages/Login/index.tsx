import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.tsx'
import Input from '../../components/ui/Input.tsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts'
import { useAuth } from '../../auth/useAuth.ts'
import { loginRequest } from '../../services/auth-service.ts'
import styles from './styles.module.css'

function LoginPage() {
   useDocumentTitle('Iniciar sesion')

   const navigate = useNavigate()
   const { setAuthToken } = useAuth()

   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setError('')
      setIsSubmitting(true)

      try {
         const { data } = await loginRequest({ email, password })

         if (!data.token) {
            throw new Error('La respuesta no incluye token JWT.')
         }

         setAuthToken(data.token)
         navigate("/dashboard", { replace: true })
      } catch (requestError) {
         const message = (requestError as { message?: string })?.message
         setError(message || 'No se pudo iniciar sesion.')
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

            <label htmlFor="password">Contraseña</label>
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
         <p>
            <Link to="/forgot-password">Olvidaste tu contrasena?</Link>
         </p>
      </section>
   )
}

export default LoginPage
