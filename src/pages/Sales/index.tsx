import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   cancelSale,
   confirmSale,
   createSale,
   listSales,
   type CreateSaleRequest,
   type SaleStatus,
   type SaleSummary,
} from '../../services/sales-service'
import styles from './styles.module.css'

function SalesPage() {
   useDocumentTitle('Ventas')

   const [sales, setSales] = useState<SaleSummary[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [filters, setFilters] = useState({
      clientId: '',
      state: '' as SaleStatus | '',
      from: '',
      to: '',
   })

   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')

   const [formValues, setFormValues] = useState({ clientId: '' })

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadSales() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listSales({
               page,
               size: pageSize,
               clientId: filters.clientId.trim(),
               state: filters.state,
               from: filters.from,
               to: filters.to,
            })

            if (!isMounted) {
               return
            }

            setSales(response.items)
            setTotal(response.total)
         } catch (error) {
            if (isMounted) {
               setListError((error as { message?: string })?.message || 'No se pudieron cargar las ventas.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadSales()

      return () => {
         isMounted = false
      }
   }, [page, pageSize, filters])

   function openCreateModal() {
      setFormValues({ clientId: '' })
      setSubmitError('')
      setIsModalOpen(true)
   }

   function closeModal() {
      if (isSubmitting) {
         return
      }

      setIsModalOpen(false)
   }

   function handleFilterChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      const { name, value } = event.target
      setPage(1)
      setFilters((prev) => ({ ...prev, [name]: value }))
   }

   async function loadCurrentPage() {
      const response = await listSales({
         page,
         size: pageSize,
         clientId: filters.clientId.trim(),
         state: filters.state,
         from: filters.from,
         to: filters.to,
      })

      setSales(response.items)
      setTotal(response.total)
   }

   async function handleSubmitSale(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')

      const payload: CreateSaleRequest = {
         clientId: formValues.clientId.trim(),
      }

      if (!payload.clientId) {
         setSubmitError('El cliente es obligatorio.')
         setIsSubmitting(false)
         return
      }

      try {
         await createSale(payload)
         setIsModalOpen(false)
         await loadCurrentPage()
      } catch (error) {
         setSubmitError((error as { message?: string })?.message || 'No se pudo crear la venta.')
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleConfirmSale(sale: SaleSummary) {
      if (sale.total <= 0) {
         setListError('No se puede confirmar una venta sin productos.')
         return
      }

      if (!window.confirm(`Confirmar la venta #${sale.id}?`)) {
         return
      }

      try {
         await confirmSale(sale.id)
         await loadCurrentPage()
      } catch (error) {
         setListError((error as { message?: string })?.message || 'No se pudo confirmar la venta.')
      }
   }

   async function handleCancelSale(sale: SaleSummary) {
      if (!window.confirm(`Cancelar la venta #${sale.id}?`)) {
         return
      }

      try {
         await cancelSale(sale.id)
         await loadCurrentPage()
      } catch (error) {
         setListError((error as { message?: string })?.message || 'No se pudo cancelar la venta.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Ventas</h1>
               <p>Controla el ciclo de ventas, estados y fechas.</p>
            </div>
            <Button type="button" onClick={openCreateModal}>
               Nueva venta
            </Button>
         </div>

         <div className={styles.filterRow}>
            <Input
               name="clientId"
               value={filters.clientId}
               onChange={handleFilterChange}
               placeholder="Cliente ID"
               aria-label="Filtrar por cliente"
            />
            <select name="state" className={styles.select} value={filters.state} onChange={handleFilterChange}>
               <option value="">Estado: todos</option>
               <option value="ABIERTA">Abierta</option>
               <option value="CERRADA">Cerrada</option>
               <option value="ANULADA">Anulada</option>
            </select>
            <Input name="from" type="datetime-local" value={filters.from} onChange={handleFilterChange} />
            <Input name="to" type="datetime-local" value={filters.to} onChange={handleFilterChange} />
         </div>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>ID</th>
                     <th>Cliente</th>
                     <th>Estado</th>
                     <th>Fecha</th>
                     <th>Total</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           Cargando ventas...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && sales.length === 0 ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           No hay ventas para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? sales.map((sale) => (
                        <tr key={sale.id}>
                           <td>{sale.id}</td>
                           <td>{sale.clientName || sale.clientId}</td>
                           <td>{sale.state}</td>
                           <td>{sale.saleDate ? new Date(sale.saleDate).toLocaleString('es-CO') : '-'}</td>
                           <td>
                              {new Intl.NumberFormat('es-CO', {
                                 style: 'currency',
                                 currency: 'COP',
                                 maximumFractionDigits: 0,
                              }).format(sale.total || 0)}
                           </td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Link className={styles.linkButton} to={`/sales/${sale.id}`}>
                                    Ver
                                 </Link>
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
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de venta">
               <div className={styles.modalCard}>
                  <h2>Crear venta</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitSale}>
                     <label htmlFor="clientId">Cliente ID</label>
                     <Input
                        id="clientId"
                        name="clientId"
                        value={formValues.clientId}
                        onChange={(event) => setFormValues({ clientId: event.target.value })}
                        placeholder="ID del cliente"
                        required
                     />

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

export default SalesPage
