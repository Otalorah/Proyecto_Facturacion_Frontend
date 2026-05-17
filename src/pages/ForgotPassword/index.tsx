import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { forgotPasswordRequest } from '../../services/auth-service'
import styles from './styles.module.css'

function ForgotPasswordPage() {
   useDocumentTitle('Recuperar contrasena')

   const [email, setEmail] = useState('')
   const [message, setMessage] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setError('')
      setMessage('')
      setIsSubmitting(true)

      try {
         const response = await forgotPasswordRequest({ email })
         setMessage(response.message || 'Revisa tu correo para continuar el proceso.')
      } catch (requestError) {
         const errorMessage = (requestError as { message?: string })?.message
         setError(errorMessage || 'No se pudo enviar la solicitud.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.panel}>
            <header className={styles.header}>
               <span className={styles.badge}>Soporte de acceso</span>
               <h1>Recuperar contrasena</h1>
               <p>Enviaremos un enlace para restablecer el acceso.</p>
            </header>

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

               {error ? <p className={styles.error}>{error}</p> : null}
               {message ? <p className={styles.success}>{message}</p> : null}

               <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
               </Button>
            </form>

            <div className={styles.footer}>
               <Link to="/login">Volver a inicio de sesion</Link>
            </div>
         </div>
      </section>
   )
}

export default ForgotPasswordPage
