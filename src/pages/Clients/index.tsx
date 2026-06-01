import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   createClient,
   deleteClient,
   listClients,
   updateClient,
   type Client,
   type ClientInput,
} from '../../services/clients-service'
import styles from './styles.module.css'

function ClientsPage() {
   useDocumentTitle('Clientes')

   const [clients, setClients] = useState<Client[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [editingClient, setEditingClient] = useState<Client | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')
   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

   type FormValues = {
      name: string
      nit: string
      email: string
      telephone: string
      address: string
   }

   const [formValues, setFormValues] = useState<FormValues>({
      name: '',
      nit: '',
      email: '',
      telephone: '',
      address: '',
   })

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadClients() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listClients({ page, size: pageSize })

            if (!isMounted) {
               return
            }

            setClients(response.items)
            setTotal(response.total)
         } catch (error) {
            if (isMounted) {
               setListError((error as { message?: string })?.message || 'No se pudieron cargar los clientes.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadClients()

      return () => {
         isMounted = false
      }
   }, [page, pageSize])

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
      setEditingClient(null)
      setFormValues({
         name: '',
         nit: '',
         email: '',
         telephone: '',
         address: '',
      })
      setSubmitError('')
      setValidationErrors({})
      setIsModalOpen(true)
   }

   function openEditModal(client: Client) {
      setEditingClient(client)
      setFormValues({
         name: client.name,
         nit: client.nit,
         email: client.email,
         telephone: client.telephone,
         address: client.address,
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

   function handleChangeField(event: ChangeEvent<HTMLInputElement>) {
      const { name, value } = event.target
      setFormValues((prev) => ({ ...prev, [name]: value }))
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
   }

   async function loadCurrentPage() {
      const response = await listClients({ page, size: pageSize })
      setClients(response.items)
      setTotal(response.total)
   }

   async function handleSubmitClient(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')
      setValidationErrors({})

      const payload: ClientInput = {
         name: formValues.name.trim(),
         nit: formValues.nit.trim(),
         email: formValues.email.trim(),
         telephone: formValues.telephone.trim(),
         address: formValues.address.trim(),
      }

      try {
         if (editingClient) {
            await updateClient(editingClient.id, payload)
         } else {
            await createClient(payload)
         }

         setIsModalOpen(false)
         await loadCurrentPage()
      } catch (error) {
         const backendFieldErrors = extractValidationErrors(error)

         if (Object.keys(backendFieldErrors).length > 0) {
            setValidationErrors(backendFieldErrors)
         } else {
            setSubmitError((error as { message?: string })?.message || 'No se pudo guardar el cliente.')
         }
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleDelete(client: Client) {
      const approved = window.confirm(`Se eliminara el cliente "${client.name}". Esta accion no se puede deshacer.`)

      if (!approved) {
         return
      }

      try {
         await deleteClient(client.id)

         if (clients.length === 1 && page > 1) {
            setPage((prev) => prev - 1)
            return
         }

         await loadCurrentPage()
      } catch (error) {
         setListError((error as { message?: string })?.message || 'No se pudo eliminar el cliente.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Clientes</h1>
               <p>Consulta, crea y actualiza clientes registrados.</p>
            </div>
            <Button type="button" onClick={openCreateModal}>
               Nuevo cliente
            </Button>
         </div>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Nombre</th>
                     <th>NIT</th>
                     <th>Correo</th>
                     <th>Telefono</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                           Cargando clientes...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && clients.length === 0 ? (
                     <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                           No hay clientes para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? clients.map((client) => (
                        <tr key={client.id}>
                           <td>{client.name}</td>
                           <td>{client.nit}</td>
                           <td>{client.email || '-'}</td>
                           <td>{client.telephone || '-'}</td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Link className={styles.linkButton} to={`/clients/${client.id}`}>
                                    Ver
                                 </Link>
                                 <Button type="button" variant="secondary" onClick={() => openEditModal(client)}>
                                    Editar
                                 </Button>
                                 <Button type="button" onClick={() => handleDelete(client)}>
                                    Eliminar
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
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de cliente">
               <div className={styles.modalCard}>
                  <h2>{editingClient ? 'Editar cliente' : 'Crear cliente'}</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitClient}>
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

                     <label htmlFor="nit">NIT</label>
                     <Input
                        id="nit"
                        name="nit"
                        value={formValues.nit}
                        onChange={handleChangeField}
                        placeholder="NIT"
                        required
                     />
                     {validationErrors.nit ? <p className={styles.fieldError}>{validationErrors.nit}</p> : null}

                     <label htmlFor="email">Correo</label>
                     <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleChangeField}
                        placeholder="correo@empresa.com"
                     />
                     {validationErrors.email ? <p className={styles.fieldError}>{validationErrors.email}</p> : null}

                     <label htmlFor="telephone">Telefono</label>
                     <Input
                        id="telephone"
                        name="telephone"
                        value={formValues.telephone}
                        onChange={handleChangeField}
                        placeholder="Telefono"
                     />
                     {validationErrors.telephone ? <p className={styles.fieldError}>{validationErrors.telephone}</p> : null}

                     <label htmlFor="address">Direccion</label>
                     <Input
                        id="address"
                        name="address"
                        value={formValues.address}
                        onChange={handleChangeField}
                        placeholder="Direccion"
                     />
                     {validationErrors.address ? <p className={styles.fieldError}>{validationErrors.address}</p> : null}

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

export default ClientsPage
