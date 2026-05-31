import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import InfoList from '../../components/ui/InfoList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { exportInvoicePdf, getInvoice, type Invoice } from '../../services/invoices-service'
import styles from './detail.module.css'

function InvoiceDetailPage() {
   const { id } = useParams()
   useDocumentTitle('Detalle de factura')

   const [invoice, setInvoice] = useState<Invoice | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')

   useEffect(() => {
      let isMounted = true

      async function loadInvoice() {
         if (!id) {
            return
         }

         setIsLoading(true)
         setError('')

         try {
            const response = await getInvoice(id)
            if (isMounted) {
               setInvoice(response)
            }
         } catch (requestError) {
            if (isMounted) {
               setError((requestError as { message?: string })?.message || 'No se pudo cargar la factura.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadInvoice()

      return () => {
         isMounted = false
      }
   }, [id])

   async function handleExport() {
      if (!invoice) {
         return
      }

      try {
         const blob = await exportInvoicePdf(invoice.id)
         const url = URL.createObjectURL(blob)
         const anchor = document.createElement('a')
         anchor.href = url
         anchor.download = invoice.invoiceNumber ? `invoice-${invoice.invoiceNumber}.pdf` : `invoice-${invoice.id}.pdf`
         anchor.click()
         URL.revokeObjectURL(url)
      } catch (requestError) {
         setError((requestError as { message?: string })?.message || 'No se pudo exportar la factura.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <header className={styles.headerRow}>
            <div>
               <h1>Detalle de factura</h1>
               <p>Consulta la informacion completa y los productos facturados.</p>
            </div>
            <Link className={styles.linkButton} to="/invoices">
               Volver
            </Link>
         </header>

         {error ? <p className={styles.error}>{error}</p> : null}
         {isLoading ? <p className={styles.muted}>Cargando factura...</p> : null}

         {!isLoading && invoice ? (
            <div className={styles.card}>
               <InfoList
                  items={[
                     { label: 'Factura', value: invoice.invoiceNumber || invoice.id },
                     { label: 'Venta', value: invoice.saleId },
                     { label: 'Tipo', value: invoice.type },
                     { label: 'Estado', value: invoice.status || '-' },
                     {
                        label: 'Total',
                        value: new Intl.NumberFormat('es-CO', {
                           style: 'currency',
                           currency: 'COP',
                           maximumFractionDigits: 0,
                        }).format(invoice.total || 0),
                     },
                     { label: 'Fecha', value: invoice.createdAt ? new Date(invoice.createdAt).toLocaleString('es-CO') : '-' },
                  ]}
               />
               <div className={styles.actionsRow}>
                  <Button type="button" onClick={handleExport}>
                     Exportar PDF
                  </Button>
               </div>
            </div>
         ) : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Producto</th>
                     <th>Cantidad</th>
                     <th>Precio</th>
                     <th>Total</th>
                  </tr>
               </thead>
               <tbody>
                  {!isLoading && invoice?.items?.length === 0 ? (
                     <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                           No hay productos en la factura.
                        </td>
                     </tr>
                  ) : null}

                  {invoice?.items?.map((item) => (
                     <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>
                           {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0,
                           }).format(item.unitPrice || 0)}
                        </td>
                        <td>
                           {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0,
                           }).format(item.total || 0)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
   )
}

export default InvoiceDetailPage
