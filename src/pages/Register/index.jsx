import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../auth/useAuth'
import { registerRequest } from '../../services/auth-service'
import styles from './styles.module.css'

function RegisterPage() {
   useDocumentTitle('Registro')

   const navigate = useNavigate()
   const { setAuthToken } = useAuth()

   const [name, setName] = useState('')
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   async function handleSubmit(event) {
      event.preventDefault()
      setError('')

      if (password !== confirmPassword) {
         setError('Las contrasenas no coinciden.')
         return
      }

      setIsSubmitting(true)

      try {
         const { token } = await registerRequest({ name, email, password })

         if (!token) {
            throw new Error('La respuesta no incluye token JWT.')
         }

         setAuthToken(token)
         navigate('/dashboard', { replace: true })
      } catch (requestError) {
         setError(requestError.message || 'No se pudo completar el registro.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <h1>Crear cuenta</h1>
         <p>Registra tu empresa y empieza a facturar.</p>

         <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="name">Nombre</label>
            <Input
               id="name"
               type="text"
               value={name}
               onChange={(event) => setName(event.target.value)}
               placeholder="Tu nombre"
               required
            />

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
               autoComplete="new-password"
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               placeholder="********"
               required
            />

            <label htmlFor="confirmPassword">Confirmar contrasena</label>
            <Input
               id="confirmPassword"
               type="password"
               autoComplete="new-password"
               value={confirmPassword}
               onChange={(event) => setConfirmPassword(event.target.value)}
               placeholder="********"
               required
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
            </Button>
         </form>

         <p>
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
         </p>
      </section>
   )
}

export default RegisterPage
