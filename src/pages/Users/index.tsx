import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   activateUser,
   createUser,
   deactivateUser,
   listUsers,
   updateUser,
   type UserInput,
   type UserRole,
   type UserSummary,
} from '../../services/users-service'
import styles from './styles.module.css'

function UsersPage() {
   useDocumentTitle('Usuarios')

   const [users, setUsers] = useState<UserSummary[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')

   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')
   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

   type FormValues = {
      name: string
      email: string
      password: string
      role: UserRole
   }

   const [formValues, setFormValues] = useState<FormValues>({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
   })

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadUsers() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listUsers({
               page,
               size: pageSize,
               role: roleFilter,
            })

            if (!isMounted) {
               return
            }

            setUsers(response.items)
            setTotal(response.total)
         } catch (error) {
            if (!isMounted) {
               return
            }

            const message = (error as { message?: string })?.message
            setListError(message || 'No se pudieron cargar los usuarios.')
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadUsers()

      return () => {
         isMounted = false
      }
   }, [page, pageSize, roleFilter])

   function extractValidationErrors(error: unknown): Record<string, string> {
      const details = (error as { details?: unknown })?.details ?? {}
      const map: Record<string, string> = {}

      const groups = [details.errors, details.violations, details.validationErrors]

      for (const group of groups) {
         if (Array.isArray(group)) {
            for (const item of group) {
               const field = (item as Record<string, unknown>)?.field || (item as Record<string, unknown>)?.path
               const message = (item as Record<string, unknown>)?.message || (item as Record<string, unknown>)?.defaultMessage

               if (field && message) {
                  map[String(field)] = String(message)
               }
            }
         } else if (group && typeof group === 'object') {
            for (const [field, message] of Object.entries(group)) {
               map[field] = Array.isArray(message) ? message[0] : String(message)
            }
         }
      }

      return map
   }

   function openCreateModal() {
      setEditingUser(null)
      setFormValues({
         name: '',
         email: '',
         password: '',
         role: 'EMPLOYEE',
      })
      setSubmitError('')
      setValidationErrors({})
      setIsModalOpen(true)
   }

   function openEditModal(user: UserSummary) {
      setEditingUser(user)
      setFormValues({
         name: user.name,
         email: user.email,
         password: '',
         role: user.role,
      })
      setSubmitError('')
      setValidationErrors({})
      setIsModalOpen(true)
   }

   function closeModal() {
      if (isSubmitting) {
         return
      }

      setIsModalOpen(false)
   }

   function handleChangeField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      const { name, value } = event.target
      setFormValues((prev) => ({ ...prev, [name]: value }))
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
   }

   async function loadCurrentPage() {
      const response = await listUsers({
         page,
         size: pageSize,
         role: roleFilter,
      })

      setUsers(response.items)
      setTotal(response.total)
   }

   async function handleSubmitUser(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')
      setValidationErrors({})

      const payload: UserInput = {
         name: formValues.name.trim(),
         email: formValues.email.trim(),
         role: formValues.role,
      }

      if (!editingUser) {
         payload.password = formValues.password
      }

      if (!editingUser && !payload.password) {
         setValidationErrors({ password: 'La contrasena es obligatoria.' })
         setIsSubmitting(false)
         return
      }

      try {
         if (editingUser) {
            await updateUser(editingUser.id, payload)
         } else {
            await createUser(payload)
         }

         setIsModalOpen(false)
         await loadCurrentPage()
      } catch (error) {
         const backendFieldErrors = extractValidationErrors(error)

         if (Object.keys(backendFieldErrors).length > 0) {
            setValidationErrors(backendFieldErrors)
         } else {
            const message = (error as { message?: string })?.message
            setSubmitError(message || 'No se pudo guardar el usuario.')
         }
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleToggleStatus(user: UserSummary) {
      const action = user.active ? 'desactivar' : 'activar'
      const approved = window.confirm(`Se va a ${action} el usuario "${user.name}".`)

      if (!approved) {
         return
      }

      try {
         if (user.active) {
            await deactivateUser(user.id)
         } else {
            await activateUser(user.id)
         }

         await loadCurrentPage()
      } catch (error) {
         const message = (error as { message?: string })?.message
         setListError(message || 'No se pudo actualizar el usuario.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Usuarios</h1>
               <p>Administra empleados, roles y estados de acceso.</p>
            </div>
            <Button type="button" onClick={openCreateModal}>
               Nuevo usuario
            </Button>
         </div>

         <div className={styles.filterRow}>
            <label htmlFor="role" className={styles.filterLabel}>
               Rol
            </label>
            <select
               id="role"
               name="role"
               className={styles.select}
               value={roleFilter}
               onChange={(event) => {
                  setPage(1)
                  setRoleFilter(event.target.value as UserRole | '')
               }}
            >
               <option value="">Todos</option>
               <option value="ADMIN">Admin</option>
               <option value="EMPLOYEE">Empleado</option>
            </select>
         </div>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Nombre</th>
                     <th>Correo</th>
                     <th>Rol</th>
                     <th>Estado</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                           Cargando usuarios...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && users.length === 0 ? (
                     <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                           No hay usuarios para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? users.map((user) => (
                        <tr key={user.id}>
                           <td>{user.name}</td>
                           <td>{user.email}</td>
                           <td>{user.role === 'ADMIN' ? 'Admin' : 'Empleado'}</td>
                           <td>{user.active ? 'Activo' : 'Inactivo'}</td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Button type="button" variant="secondary" onClick={() => openEditModal(user)}>
                                    Editar
                                 </Button>
                                 <Button type="button" onClick={() => handleToggleStatus(user)}>
                                    {user.active ? 'Desactivar' : 'Activar'}
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))
                     : null}
               </tbody>
            </table>
         </div>

         <div className={styles.pagination}>
            <Button
               type="button"
               variant="secondary"
               disabled={page <= 1 || isLoading}
               onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
               Anterior
            </Button>
            <span>
               Pagina {page} de {totalPages}
            </span>
            <Button
               type="button"
               variant="secondary"
               disabled={page >= totalPages || isLoading}
               onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
               Siguiente
            </Button>
         </div>

         {isModalOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de usuario">
               <div className={styles.modalCard}>
                  <h2>{editingUser ? 'Editar usuario' : 'Crear usuario'}</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitUser}>
                     <label htmlFor="name">Nombre</label>
                     <Input
                        id="name"
                        name="name"
                        value={formValues.name}
                        onChange={handleChangeField}
                        placeholder="Nombre completo"
                        required
                     />
                     {validationErrors.name ? <p className={styles.fieldError}>{validationErrors.name}</p> : null}

                     <label htmlFor="email">Correo</label>
                     <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleChangeField}
                        placeholder="correo@empresa.com"
                        required
                     />
                     {validationErrors.email ? <p className={styles.fieldError}>{validationErrors.email}</p> : null}

                     {!editingUser ? (
                        <>
                           <label htmlFor="password">Contrasena</label>
                           <Input
                              id="password"
                              name="password"
                              type="password"
                              value={formValues.password}
                              onChange={handleChangeField}
                              placeholder="********"
                              required
                           />
                           {validationErrors.password ? (
                              <p className={styles.fieldError}>{validationErrors.password}</p>
                           ) : null}
                        </>
                     ) : null}

                     <label htmlFor="role">Rol</label>
                     <select
                        id="role"
                        name="role"
                        className={styles.select}
                        value={formValues.role}
                        onChange={handleChangeField}
                     >
                        <option value="ADMIN">Admin</option>
                        <option value="EMPLOYEE">Empleado</option>
                     </select>
                     {validationErrors.role ? <p className={styles.fieldError}>{validationErrors.role}</p> : null}

                     {submitError ? <p className={styles.error}>{submitError}</p> : null}

                     <div className={styles.modalActions}>
                        <Button type="button" variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                           Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                           {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         ) : null}
      </section>
   )
}

export default UsersPage
