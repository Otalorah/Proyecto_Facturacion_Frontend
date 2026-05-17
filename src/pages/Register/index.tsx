import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.tsx'
import Input from '../../components/ui/Input.tsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts'
import { registerRequest } from '../../services/auth-service.ts'
import styles from './styles.module.css'

function RegisterPage() {
   useDocumentTitle('Registro')

   const navigate = useNavigate()
   const [name, setName] = useState('')
   const [email, setEmail] = useState('')
   const [password, setPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setError('')

      if (password !== confirmPassword) {
         setError('Las contrasenas no coinciden.')
         return
      }

      if (password.length < 8) {
         setError('La contrasena debe tener al menos 8 caracteres.')
         return
      }

      setIsSubmitting(true)

      try {
         await registerRequest({ name, email, password })
         navigate('/login', { replace: true })
      } catch (requestError) {
         const message = (requestError as { message?: string })?.message
         setError(message || 'No se pudo completar el registro.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.panel}>
            <header className={styles.header}>
               <span className={styles.badge}>Alta de empresa</span>
               <h1>Crear cuenta</h1>
               <p>Registra tu empresa y empieza a facturar.</p>
            </header>

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

            <div className={styles.footer}>
               <span>
                  Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
               </span>
            </div>
         </div>
      </section>
   )
}

export default RegisterPage
