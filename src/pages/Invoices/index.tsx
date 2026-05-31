import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   createInvoice,
   exportInvoicePdf,
   listInvoices,
   type CreateInvoiceRequest,
   type Invoice,
   type InvoiceType,
} from '../../services/invoices-service'
import styles from './styles.module.css'

function InvoicesPage() {
   useDocumentTitle('Facturas')

   const [invoices, setInvoices] = useState<Invoice[]>([])
   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')

   const [formValues, setFormValues] = useState({ saleId: '', type: 'SIMPLE' as InvoiceType })

   useEffect(() => {
      let isMounted = true

      async function loadInvoices() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listInvoices()
            if (isMounted) {
               setInvoices(response)
            }
         } catch (error) {
            if (isMounted) {
               setListError((error as { message?: string })?.message || 'No se pudieron cargar las facturas.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadInvoices()

      return () => {
         isMounted = false
      }
   }, [])

   function openCreateModal() {
      setFormValues({ saleId: '', type: 'SIMPLE' })
      setSubmitError('')
      setIsModalOpen(true)
   }

   function closeModal() {
      if (isSubmitting) {
         return
      }

      setIsModalOpen(false)
   }

   async function refreshList() {
      const response = await listInvoices()
      setInvoices(response)
   }

   async function handleSubmitInvoice(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')

      const payload: CreateInvoiceRequest = {
         saleId: formValues.saleId.trim(),
         type: formValues.type,
      }

      if (!payload.saleId) {
         setSubmitError('El ID de la venta es obligatorio.')
         setIsSubmitting(false)
         return
      }

      try {
         await createInvoice(payload)
         setIsModalOpen(false)
         await refreshList()
      } catch (error) {
         setSubmitError((error as { message?: string })?.message || 'No se pudo crear la factura.')
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleExport(invoice: Invoice) {
      try {
         const blob = await exportInvoicePdf(invoice.id)
         const url = URL.createObjectURL(blob)
         const anchor = document.createElement('a')
         anchor.href = url
         anchor.download = invoice.invoiceNumber ? `invoice-${invoice.invoiceNumber}.pdf` : `invoice-${invoice.id}.pdf`
         anchor.click()
         URL.revokeObjectURL(url)
      } catch (error) {
         setListError((error as { message?: string })?.message || 'No se pudo exportar la factura.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Facturas</h1>
               <p>Genera, consulta y exporta facturas desde ventas confirmadas.</p>
            </div>
            <Button type="button" onClick={openCreateModal}>
               Nueva factura
            </Button>
         </div>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Numero</th>
                     <th>Venta</th>
                     <th>Tipo</th>
                     <th>Estado</th>
                     <th>Total</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           Cargando facturas...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && invoices.length === 0 ? (
                     <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                           No hay facturas para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? invoices.map((invoice) => (
                        <tr key={invoice.id}>
                           <td>{invoice.invoiceNumber || invoice.id}</td>
                           <td>{invoice.saleId}</td>
                           <td>{invoice.type}</td>
                           <td>{invoice.status || '-'}</td>
                           <td>
                              {new Intl.NumberFormat('es-CO', {
                                 style: 'currency',
                                 currency: 'COP',
                                 maximumFractionDigits: 0,
                              }).format(invoice.total || 0)}
                           </td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Link className={styles.linkButton} to={`/invoices/${invoice.id}`}>
                                    Ver
                                 </Link>
                                 <Button type="button" variant="secondary" onClick={() => handleExport(invoice)}>
                                    Exportar PDF
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))
                     : null}
               </tbody>
            </table>
         </div>

         {isModalOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Formulario de factura">
               <div className={styles.modalCard}>
                  <h2>Crear factura</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitInvoice}>
                     <label htmlFor="saleId">Venta ID</label>
                     <Input
                        id="saleId"
                        name="saleId"
                        value={formValues.saleId}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, saleId: event.target.value }))}
                        placeholder="ID de la venta"
                        required
                     />

                     <label htmlFor="type">Tipo</label>
                     <select
                        id="type"
                        name="type"
                        className={styles.select}
                        value={formValues.type}
                        onChange={(event) =>
                           setFormValues((prev) => ({ ...prev, type: event.target.value as InvoiceType }))
                        }
                     >
                        <option value="SIMPLE">Simple</option>
                        <option value="DETAILED">Detallada</option>
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
      </section>
   )
}

export default InvoicesPage
