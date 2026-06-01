import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   createManualPayment,
   createPayment,
   fetchPaymentQrImage,
   listPayments,
   type Payment,
   type PaymentMethod,
   type PaymentStatus,
} from '../../services/payments-service'
import styles from './styles.module.css'

function PaymentsPage() {
   useDocumentTitle('Pagos')

   const [payments, setPayments] = useState<Payment[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [filters, setFilters] = useState({
      invoiceId: '',
      method: '' as PaymentMethod | '',
      status: '' as PaymentStatus | '',
   })

   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [isManualModalOpen, setIsManualModalOpen] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')
   const [qrModal, setQrModal] = useState({ isOpen: false, imageUrl: '', invoiceId: '' })
   const [isQrLoading, setIsQrLoading] = useState(false)

   const [formValues, setFormValues] = useState({ invoiceId: '', amount: '', method: 'CASH' as PaymentMethod })
   const [manualForm, setManualForm] = useState({
      invoiceId: '',
      amount: '',
      method: 'CASH' as PaymentMethod,
      reference: '',
   })

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadPayments() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listPayments({
               page,
               size: pageSize,
               invoiceId: filters.invoiceId.trim(),
               method: filters.method,
               status: filters.status,
            })

            if (!isMounted) {
               return
            }

            setPayments(response.items)
            setTotal(response.total)
         } catch (error) {
            if (isMounted) {
               setListError((error as { message?: string })?.message || 'No se pudieron cargar los pagos.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadPayments()

      return () => {
         isMounted = false
      }
   }, [page, pageSize, filters])

   function openCreateModal() {
      setFormValues({ invoiceId: '', amount: '', method: 'CASH' })
      setSubmitError('')
      setIsModalOpen(true)
   }

   function openManualModal() {
      setManualForm({ invoiceId: '', amount: '', method: 'CASH', reference: '' })
      setSubmitError('')
      setIsManualModalOpen(true)
   }

   function closeModal() {
      if (isSubmitting) {
         return
      }

      setIsModalOpen(false)
      setIsManualModalOpen(false)
   }

   function closeQrModal() {
      if (qrModal.imageUrl) {
         URL.revokeObjectURL(qrModal.imageUrl)
      }
      setQrModal({ isOpen: false, imageUrl: '', invoiceId: '' })
      setIsQrLoading(false)
   }

   function handleFilterChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      const { name, value } = event.target
      setPage(1)
      setFilters((prev) => ({ ...prev, [name]: value }))
   }

   async function reloadPage() {
      const response = await listPayments({
         page,
         size: pageSize,
         invoiceId: filters.invoiceId.trim(),
         method: filters.method,
         status: filters.status,
      })

      setPayments(response.items)
      setTotal(response.total)
   }

   async function handleSubmitPayment(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')

      const amount = Number(formValues.amount)

      if (formValues.method === 'QR') {
         setIsModalOpen(false)
         await handleShowQrFromInvoice(formValues.invoiceId.trim())
         return
      }

      if (!formValues.invoiceId.trim() || !Number.isFinite(amount)) {
         setSubmitError('Completa el ID de la factura y el monto.')
         setIsSubmitting(false)
         return
      }

      try {
         await createPayment({
            invoiceId: formValues.invoiceId.trim(),
            method: formValues.method,
            amount,
         })
         setIsModalOpen(false)
         await reloadPage()
      } catch (error) {
         setSubmitError((error as { message?: string })?.message || 'No se pudo registrar el pago.')
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleSubmitManualPayment(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')

      const amount = Number(manualForm.amount)

      if (!manualForm.invoiceId.trim() || !Number.isFinite(amount)) {
         setSubmitError('Completa el ID de la factura y el monto.')
         setIsSubmitting(false)
         return
      }

      try {
         await createManualPayment({
            invoiceId: manualForm.invoiceId.trim(),
            amount,
         })
         setIsManualModalOpen(false)
         await reloadPage()
      } catch (error) {
         setSubmitError((error as { message?: string })?.message || 'No se pudo registrar el pago manual.')
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleShowQrFromInvoice(invoiceId: string) {
      if (!invoiceId) {
         setSubmitError('Ingresa el ID de la factura para ver el QR.')
         return
      }

      try {
         setIsQrLoading(true)
         setQrModal({ isOpen: true, imageUrl: '', invoiceId })
         const blob = await fetchPaymentQrImage(invoiceId)
         const url = URL.createObjectURL(blob)
         setQrModal({ isOpen: true, imageUrl: url, invoiceId })
      } catch (error) {
         setListError((error as { message?: string })?.message || 'No se pudo cargar el QR.')
         setQrModal({ isOpen: false, imageUrl: '', invoiceId: '' })
      } finally {
         setIsQrLoading(false)
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Pagos</h1>
               <p>Registra pagos, gestiona metodos y revisa estados.</p>
            </div>
            <div className={styles.headerActions}>
               <Button type="button" variant="secondary" onClick={openManualModal}>
                  Pago manual
               </Button>
               <Button type="button" onClick={openCreateModal}>
                  Nuevo pago
               </Button>
            </div>
         </div>

         <div className={styles.filterRow}>
            <Input
               name="invoiceId"
               value={filters.invoiceId}
               onChange={handleFilterChange}
               placeholder="Factura ID"
               aria-label="Filtrar por factura"
            />
            <select name="method" className={styles.select} value={filters.method} onChange={handleFilterChange}>
               <option value="">Metodo: todos</option>
               <option value="CASH">Efectivo</option>
               <option value="CARD">Tarjeta credito</option>
               <option value="QR">QR</option>
               <option value="TRANSFER">Transferencia</option>
            </select>
            <select name="status" className={styles.select} value={filters.status} onChange={handleFilterChange}>
               <option value="">Estado: todos</option>
               <option value="PENDIENTE">Pendiente</option>
               <option value="APROBADO">Aprobado</option>
               <option value="RECHAZADO">Rechazado</option>
            </select>
         </div>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>ID</th>
                     <th>Factura</th>
                     <th>Metodo</th>
                     <th>Estado</th>
                     <th>Monto</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           Cargando pagos...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && payments.length === 0 ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           No hay pagos para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? payments.map((payment) => (
                        <tr key={payment.id}>
                           <td>{payment.id}</td>
                           <td>{payment.invoiceId}</td>
                           <td>{payment.method}</td>
                           <td>{payment.status}</td>
                           <td>
                              {new Intl.NumberFormat('es-CO', {
                                 style: 'currency',
                                 currency: 'COP',
                                 maximumFractionDigits: 0,
                              }).format(payment.amount || 0)}
                           </td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Link className={styles.linkButton} to={`/payments/${payment.id}`}>
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
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de pago">
               <div className={styles.modalCard}>
                  <h2>Registrar pago</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitPayment}>
                     <label htmlFor="invoiceId">Factura ID</label>
                     <Input
                        id="invoiceId"
                        name="invoiceId"
                        value={formValues.invoiceId}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, invoiceId: event.target.value }))}
                        placeholder="ID de la factura"
                        required
                     />

                     <label htmlFor="amount">Monto</label>
                     <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        value={formValues.amount}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, amount: event.target.value }))}
                        placeholder="Monto"
                        required
                     />

                     <label htmlFor="method">Metodo</label>
                     <select
                        id="method"
                        name="method"
                        className={styles.select}
                        value={formValues.method}
                        onChange={(event) =>
                           setFormValues((prev) => ({ ...prev, method: event.target.value as PaymentMethod }))
                        }
                     >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta credito</option>
                        <option value="QR">QR</option>
                        <option value="TRANSFER">Transferencia</option>
                     </select>

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

         {isManualModalOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de pago manual">
               <div className={styles.modalCard}>
                  <h2>Pago manual</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitManualPayment}>
                     <label htmlFor="manualInvoiceId">Factura ID</label>
                     <Input
                        id="manualInvoiceId"
                        name="invoiceId"
                        value={manualForm.invoiceId}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, invoiceId: event.target.value }))}
                        placeholder="ID de la factura"
                        required
                     />

                     <label htmlFor="manualAmount">Monto</label>
                     <Input
                        id="manualAmount"
                        name="amount"
                        type="number"
                        min="0"
                        value={manualForm.amount}
                        onChange={(event) => setManualForm((prev) => ({ ...prev, amount: event.target.value }))}
                        placeholder="Monto"
                        required
                     />

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

         {qrModal.isOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="QR de pago">
               <div className={styles.qrModalCard}>
                  <div className={styles.qrHeader}>
                     <h2>QR de pago</h2>
                     <Button type="button" variant="secondary" onClick={closeQrModal}>
                        Cerrar
                     </Button>
                  </div>
                  <p className={styles.qrSubtitle}>Factura #{qrModal.invoiceId}</p>
                  <div className={styles.qrBody}>
                     {isQrLoading ? <p>Cargando QR...</p> : null}
                     {!isQrLoading && qrModal.imageUrl ? (
                        <img className={styles.qrImage} src={qrModal.imageUrl} alt="QR de pago" />
                     ) : null}
                  </div>
               </div>
            </div>
         ) : null}
      </section>
   )
}

export default PaymentsPage
