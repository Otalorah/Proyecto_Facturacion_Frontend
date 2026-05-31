import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { listAudits, type AuditRecord } from '../../services/audits-service'
import styles from './styles.module.css'

function AuditPage() {
   useDocumentTitle('Auditoria')

   const [records, setRecords] = useState<AuditRecord[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [filters, setFilters] = useState({ userId: '', action: '', from: '', to: '' })

   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadAudits() {
         setIsLoading(true)
         setError('')

         try {
            const response = await listAudits({
               page,
               size: pageSize,
               userId: filters.userId.trim(),
               action: filters.action.trim(),
               from: filters.from,
               to: filters.to,
            })

            if (!isMounted) {
               return
            }

            setRecords(response.items)
            setTotal(response.total)
         } catch (requestError) {
            if (isMounted) {
               setError((requestError as { message?: string })?.message || 'No se pudieron cargar las auditorias.')
            }
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadAudits()

      return () => {
         isMounted = false
      }
   }, [page, pageSize, filters])

   function handleFilterChange(event: ChangeEvent<HTMLInputElement>) {
      const { name, value } = event.target
      setPage(1)
      setFilters((prev) => ({ ...prev, [name]: value }))
   }

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Auditoria</h1>
               <p>Consulta los eventos registrados en el sistema.</p>
            </div>
         </div>

         <div className={styles.filterRow}>
            <Input
               name="userId"
               value={filters.userId}
               onChange={handleFilterChange}
               placeholder="Usuario ID"
            />
            <Input name="action" value={filters.action} onChange={handleFilterChange} placeholder="Accion" />
            <Input name="from" type="datetime-local" value={filters.from} onChange={handleFilterChange} />
            <Input name="to" type="datetime-local" value={filters.to} onChange={handleFilterChange} />
         </div>

         {error ? <p className={styles.error}>{error}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>ID</th>
                     <th>Usuario</th>
                     <th>Accion</th>
                     <th>Fecha</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                           Cargando auditorias...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && records.length === 0 ? (
                     <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                           No hay registros para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? records.map((record) => (
                        <tr key={record.id}>
                           <td>{record.id}</td>
                           <td>{record.userName || record.userId}</td>
                           <td>{record.action}</td>
                           <td>{record.createdAt ? new Date(record.createdAt).toLocaleString('es-CO') : '-'}</td>
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
      </section>
   )
}

export default AuditPage
