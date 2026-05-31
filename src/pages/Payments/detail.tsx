import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import InfoList from '../../components/ui/InfoList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fetchPaymentQrImage, getPayment, getPaymentQrViewUrl, type Payment } from '../../services/payments-service'
import styles from './detail.module.css'

function PaymentDetailPage() {
   const { id } = useParams()
   useDocumentTitle('Detalle de pago')

   const [payment, setPayment] = useState<Payment | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')
   const [qrModal, setQrModal] = useState({ isOpen: false, imageUrl: '' })
   const [isQrLoading, setIsQrLoading] = useState(false)

   useEffect(() => {
      let isMounted = true

      async function loadPayment() {
         if (!id) {
            return
         }

         setIsLoading(true)
         setError('')

         try {
            const response = await getPayment(id)
            if (isMounted) {
               setPayment(response)
            }
         } catch (requestError) {
            if (isMounted) {
               setError((requestError as { message?: string })?.message || 'No se pudo cargar el pago.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadPayment()

      return () => {
         isMounted = false
      }
   }, [id])

   async function handlePreviewQr() {
      if (!payment) {
         return
      }

      try {
         setIsQrLoading(true)
         setQrModal({ isOpen: true, imageUrl: '' })
         const blob = await fetchPaymentQrImage(payment.invoiceId)
         const url = URL.createObjectURL(blob)
         setQrModal({ isOpen: true, imageUrl: url })
      } catch (requestError) {
         setError((requestError as { message?: string })?.message || 'No se pudo descargar el QR.')
      }
      setIsQrLoading(false)
   }

   function handleCloseQrModal() {
      if (qrModal.imageUrl) {
         URL.revokeObjectURL(qrModal.imageUrl)
      }
      setQrModal({ isOpen: false, imageUrl: '' })
      setIsQrLoading(false)
   }

   return (
      <section className={styles.wrapper}>
         <header className={styles.headerRow}>
            <div>
               <h1>Detalle de pago</h1>
               <p>Informacion completa del pago seleccionado.</p>
            </div>
            <Link className={styles.linkButton} to="/payments">
               Volver
            </Link>
         </header>

         {error ? <p className={styles.error}>{error}</p> : null}
         {isLoading ? <p className={styles.muted}>Cargando pago...</p> : null}

         {!isLoading && payment ? (
            <div className={styles.card}>
               <InfoList
                  items={[
                     { label: 'Pago', value: payment.id },
                     { label: 'Factura', value: payment.invoiceId },
                     { label: 'Metodo', value: payment.method },
                     { label: 'Estado', value: payment.status },
                     {
                        label: 'Monto',
                        value: new Intl.NumberFormat('es-CO', {
                           style: 'currency',
                           currency: 'COP',
                           maximumFractionDigits: 0,
                        }).format(payment.amount || 0),
                     },
                     { label: 'Fecha', value: payment.createdAt ? new Date(payment.createdAt).toLocaleString('es-CO') : '-' },
                  ]}
               />
               <div className={styles.actionsRow}>
                  <Button type="button"onClick={handlePreviewQr}>
                     Ver QR
                  </Button>
               </div>
            </div>
         ) : null}

         {qrModal.isOpen ? (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="QR de pago">
               <div className={styles.qrModalCard}>
                  <div className={styles.qrHeader}>
                     <h2>QR de pago</h2>
                     <Button type="button" variant="secondary" onClick={handleCloseQrModal}>
                        Cerrar
                     </Button>
                  </div>
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

export default PaymentDetailPage
