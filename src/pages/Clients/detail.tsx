import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import InfoList from '../../components/ui/InfoList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getClient, type Client } from '../../services/clients-service'
import styles from './detail.module.css'

function ClientDetailPage() {
   const { id } = useParams()
   useDocumentTitle('Detalle de cliente')

   const [client, setClient] = useState<Client | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')

   useEffect(() => {
      let isMounted = true

      async function loadClient() {
         if (!id) {
            return
         }

         setIsLoading(true)
         setError('')

         try {
            const response = await getClient(id)
            if (isMounted) {
               setClient(response)
            }
         } catch (requestError) {
            if (isMounted) {
               setError((requestError as { message?: string })?.message || 'No se pudo cargar el cliente.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadClient()

      return () => {
         isMounted = false
      }
   }, [id])

   return (
      <section className={styles.wrapper}>
         <header className={styles.headerRow}>
            <div>
               <h1>Detalle de cliente</h1>
               <p>Informacion general del cliente seleccionado.</p>
            </div>
            <Link className={styles.linkButton} to="/clients">
               Volver
            </Link>
         </header>

         {error ? <p className={styles.error}>{error}</p> : null}

         {isLoading ? <p className={styles.muted}>Cargando cliente...</p> : null}

         {!isLoading && client ? (
            <div className={styles.card}>
               <InfoList
                  items={[
                     { label: 'Nombre', value: client.name },
                     { label: 'Documento', value: client.document },
                     { label: 'Correo', value: client.email || '-' },
                     { label: 'Telefono', value: client.phone || '-' },
                     { label: 'Direccion', value: client.address || '-' },
                     { label: 'Estado', value: client.active === undefined ? '-' : client.active ? 'Activo' : 'Inactivo' },
                  ]}
               />
            </div>
         ) : null}

         {!isLoading && !client && !error ? <p className={styles.muted}>No se encontro el cliente.</p> : null}

         <div className={styles.footer}>
            <Link to="/clients">
               <Button type="button" variant="secondary">
                  Volver a clientes
               </Button>
            </Link>
         </div>
      </section>
   )
}

export default ClientDetailPage
