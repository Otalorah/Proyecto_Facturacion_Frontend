import { useEffect, useState } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listProductAlerts, type Product } from '../../services/products-service'
import styles from './styles.module.css'

function AlertsPage() {
   useDocumentTitle('Alertas de stock')

   const [items, setItems] = useState<Product[]>([])
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')

   useEffect(() => {
      let isMounted = true

      async function loadAlerts() {
         setIsLoading(true)
         setError('')

         try {
            const response = await listProductAlerts()
            if (isMounted) {
               setItems(response)
            }
         } catch (requestError) {
            if (isMounted) {
               const message = (requestError as { message?: string })?.message
               setError(message || 'No se pudieron cargar las alertas.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadAlerts()

      return () => {
         isMounted = false
      }
   }, [])

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Alertas de inventario</h1>
               <p>Productos con stock bajo o en alerta.</p>
            </div>
         </div>

         {error ? <p className={styles.error}>{error}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Producto</th>
                     <th>Codigo</th>
                     <th>Stock</th>
                     <th>Precio</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                           Cargando alertas...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && items.length === 0 ? (
                     <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                           No hay productos en alerta.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? items.map((product) => (
                        <tr key={product.id}>
                           <td>{product.name}</td>
                           <td>{product.code}</td>
                           <td>{product.stock}</td>
                           <td>
                              {new Intl.NumberFormat('es-CO', {
                                 style: 'currency',
                                 currency: 'COP',
                                 maximumFractionDigits: 0,
                              }).format(product.price)}
                           </td>
                        </tr>
                     ))
                     : null}
               </tbody>
            </table>
         </div>
      </section>
   )
}

export default AlertsPage
