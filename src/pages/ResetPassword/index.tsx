import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { resetPasswordRequest } from '../../services/auth-service'
import styles from './styles.module.css'

function ResetPasswordPage() {
   useDocumentTitle('Restablecer contrasena')

   const navigate = useNavigate()
   const [searchParams] = useSearchParams()

   const [token, setToken] = useState(() => searchParams.get('token') || '')
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

      setIsSubmitting(true)

      try {
         await resetPasswordRequest({
            token,
            newPassword: password,
            confirmPassword,
         })
         navigate('/login', { replace: true })
      } catch (requestError) {
         const errorMessage = (requestError as { message?: string })?.message
         setError(errorMessage || 'No se pudo restablecer la contrasena.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <h1>Restablecer contrasena</h1>
         <p>Usa el token recibido por correo para definir una nueva contrasena.</p>

         <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="token">Token</label>
            <Input
               id="token"
               type="text"
               value={token}
               onChange={(event) => setToken(event.target.value)}
               placeholder="Token o codigo"
               required
            />

            <label htmlFor="password">Nueva contrasena</label>
            <Input
               id="password"
               type="password"
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               placeholder="********"
               required
            />

            <label htmlFor="confirmPassword">Confirmar contrasena</label>
            <Input
               id="confirmPassword"
               type="password"
               value={confirmPassword}
               onChange={(event) => setConfirmPassword(event.target.value)}
               placeholder="********"
               required
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? 'Guardando...' : 'Restablecer'}
            </Button>
         </form>

         <p>
            <Link to="/login">Volver a inicio de sesion</Link>
         </p>
      </section>
   )
}

export default ResetPasswordPage
