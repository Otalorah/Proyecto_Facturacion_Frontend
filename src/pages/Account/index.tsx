import { useState, type FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/useAppStore'
import { changePasswordRequest } from '../../services/auth-service'
import styles from './styles.module.css'

function AccountPage() {
   useDocumentTitle('Mi cuenta')

   const { currentUser } = useAppStore()

   const [currentPassword, setCurrentPassword] = useState('')
   const [newPassword, setNewPassword] = useState('')
   const [confirmPassword, setConfirmPassword] = useState('')
   const [message, setMessage] = useState('')
   const [error, setError] = useState('')
   const [isSubmitting, setIsSubmitting] = useState(false)

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setError('')
      setMessage('')

      if (newPassword !== confirmPassword) {
         setError('Las contrasenas no coinciden.')
         return
      }

      setIsSubmitting(true)

      try {
         const response = await changePasswordRequest({
            currentPassword,
            newPassword,
            confirmPassword,
         })
         setMessage(response.message || 'Contrasena actualizada correctamente.')
         setCurrentPassword('')
         setNewPassword('')
         setConfirmPassword('')
      } catch (requestError) {
         const errorMessage = (requestError as { message?: string })?.message
         setError(errorMessage || 'No se pudo actualizar la contrasena.')
      } finally {
         setIsSubmitting(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Mi cuenta</h1>
               <p>Informacion del perfil y cambio de contrasena.</p>
            </div>
         </div>

         <div className={styles.infoCard}>
            <h2>Perfil</h2>
            <dl>
               <div>
                  <dt>Nombre</dt>
                  <dd>{String(currentUser?.name || '---')}</dd>
               </div>
               <div>
                  <dt>Correo</dt>
                  <dd>{String(currentUser?.email || '---')}</dd>
               </div>
               <div>
                  <dt>Rol</dt>
                  <dd>{String(currentUser?.role || '---')}</dd>
               </div>
            </dl>
         </div>

         <form className={styles.form} onSubmit={handleSubmit}>
            <h2>Cambiar contrasena</h2>

            <label htmlFor="currentPassword">Contrasena actual</label>
            <Input
               id="currentPassword"
               type="password"
               value={currentPassword}
               onChange={(event) => setCurrentPassword(event.target.value)}
               placeholder="********"
               required
            />

            <label htmlFor="newPassword">Nueva contrasena</label>
            <Input
               id="newPassword"
               type="password"
               value={newPassword}
               onChange={(event) => setNewPassword(event.target.value)}
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
            {message ? <p className={styles.success}>{message}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? 'Actualizando...' : 'Guardar cambios'}
            </Button>
         </form>
      </section>
   )
}

export default AccountPage
