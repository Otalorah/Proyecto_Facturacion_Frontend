import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import InfoList from '../../components/ui/InfoList'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   addSaleItem,
   cancelSale,
   confirmSale,
   getSale,
   removeSaleItem,
   updateSaleItem,
   type SaleDetail,
   type SaleItem,
} from '../../services/sales-service'
import styles from './detail.module.css'

function SalesDetailPage() {
   const { id } = useParams()
   useDocumentTitle('Detalle de venta')

   const [sale, setSale] = useState<SaleDetail | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')

   const [itemForm, setItemForm] = useState({ productId: '', quantity: '' })
   const [itemError, setItemError] = useState('')

   useEffect(() => {
      let isMounted = true

      async function loadSale() {
         if (!id) {
            return
         }

         setIsLoading(true)
         setError('')

         try {
            const response = await getSale(id)
            if (isMounted) {
               setSale(response)
            }
         } catch (requestError) {
            if (isMounted) {
               setError((requestError as { message?: string })?.message || 'No se pudo cargar la venta.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadSale()

      return () => {
         isMounted = false
      }
   }, [id])

   async function reloadSale() {
      if (!id) {
         return
      }

      const response = await getSale(id)
      setSale(response)
   }

   async function handleConfirm() {
      if (!id) {
         return
      }

      if (!sale || sale.items.length === 0) {
         setError('Agrega al menos un producto para confirmar la venta.')
         return
      }

      if (!window.confirm('Confirmar esta venta?')) {
         return
      }

      try {
         const response = await confirmSale(id)
         setSale(response)
      } catch (requestError) {
         setError((requestError as { message?: string })?.message || 'No se pudo confirmar la venta.')
      }
   }

   async function handleCancel() {
      if (!id) {
         return
      }

      if (!window.confirm('Cancelar esta venta?')) {
         return
      }

      try {
         const response = await cancelSale(id)
         setSale(response)
      } catch (requestError) {
         setError((requestError as { message?: string })?.message || 'No se pudo cancelar la venta.')
      }
   }

   async function handleAddItem(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setItemError('')

      if (!id) {
         return
      }

      const quantity = Number(itemForm.quantity)

      if (!itemForm.productId.trim() || !Number.isFinite(quantity) || quantity <= 0) {
         setItemError('Completa el producto y una cantidad valida.')
         return
      }

      try {
         await addSaleItem(id, {
            productId: itemForm.productId.trim(),
            quantity,
         })
         setItemForm({ productId: '', quantity: '' })
         await reloadSale()
      } catch (requestError) {
         setItemError((requestError as { message?: string })?.message || 'No se pudo agregar el producto.')
      }
   }

   async function handleEditItem(item: SaleItem) {
      if (!id) {
         return
      }

      const nextQuantity = window.prompt('Nueva cantidad', String(item.quantity))
      if (!nextQuantity) {
         return
      }

      const quantity = Number(nextQuantity)
      if (!Number.isFinite(quantity) || quantity <= 0) {
         setItemError('Cantidad invalida.')
         return
      }

      try {
         await updateSaleItem(id, item.id, { quantity })
         await reloadSale()
      } catch (requestError) {
         setItemError((requestError as { message?: string })?.message || 'No se pudo actualizar el item.')
      }
   }

   async function handleRemoveItem(item: SaleItem) {
      if (!id) {
         return
      }

      if (!window.confirm(`Eliminar el producto "${item.productName}"?`)) {
         return
      }

      try {
         await removeSaleItem(id, item.id)
         await reloadSale()
      } catch (requestError) {
         setItemError((requestError as { message?: string })?.message || 'No se pudo eliminar el item.')
      }
   }

   return (
      <section className={styles.wrapper}>
         <header className={styles.headerRow}>
            <div>
               <h1>Detalle de venta</h1>
               <p>Consulta los productos y gestiona el estado de la venta.</p>
            </div>
            <Link className={styles.linkButton} to="/sales">
               Volver
            </Link>
         </header>

         {error ? <p className={styles.error}>{error}</p> : null}
         {isLoading ? <p className={styles.muted}>Cargando venta...</p> : null}

         {!isLoading && sale ? (
            <div className={styles.card}>
               <InfoList
                  items={[
                     { label: 'Venta', value: sale.id },
                     { label: 'Cliente', value: sale.clientName || sale.clientId },
                     { label: 'Estado', value: sale.status },
                     { label: 'Fecha', value: sale.saleDate ? new Date(sale.saleDate).toLocaleString('es-CO') : '-' },
                     {
                        label: 'Total',
                        value: new Intl.NumberFormat('es-CO', {
                           style: 'currency',
                           currency: 'COP',
                           maximumFractionDigits: 0,
                        }).format(sale.total || 0),
                     },
                  ]}
               />

               <div className={styles.actionsRow}>
                  <Button
                     type="button"
                     variant="secondary"
                     onClick={handleConfirm}
                     disabled={!sale.items.length}
                  >
                     Confirmar
                  </Button>
                  <Button type="button" onClick={handleCancel}>
                     Cancelar
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
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {!isLoading && sale?.items?.length === 0 ? (
                     <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                           No hay productos en la venta.
                        </td>
                     </tr>
                  ) : null}

                  {sale?.items?.map((item) => (
                     <tr key={item.id}>
                        <td>{item.productName || item.productId}</td>
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
                        <td>
                           <div className={styles.actionsCell}>
                              <Button type="button" variant="secondary" onClick={() => handleEditItem(item)}>
                                 Editar
                              </Button>
                              <Button type="button" onClick={() => handleRemoveItem(item)}>
                                 Eliminar
                              </Button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         <div className={styles.card}>
            <h2>Agregar producto</h2>
            <form className={styles.formRow} onSubmit={handleAddItem}>
               <Input
                  name="productId"
                  value={itemForm.productId}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, productId: event.target.value }))}
                  placeholder="ID del producto"
                  required
               />
               <Input
                  name="quantity"
                  type="number"
                  min="1"
                  value={itemForm.quantity}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder="Cantidad"
                  required
               />
               <Button type="submit">Agregar</Button>
            </form>
            {itemError ? <p className={styles.error}>{itemError}</p> : null}
         </div>
      </section>
   )
}

export default SalesDetailPage
