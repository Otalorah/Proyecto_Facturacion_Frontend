import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
   createProduct,
   deleteProduct,
   listProducts,
   updateProduct,
   type Product,
   type ProductInput,
} from '../../services/products-service'
import styles from './styles.module.css'

function HomePage() {
   useDocumentTitle('Dashboard de productos')

   const [products, setProducts] = useState<Product[]>([])
   const [total, setTotal] = useState(0)
   const [page, setPage] = useState(1)
   const pageSize = 10

   const [searchInput, setSearchInput] = useState('')
   const [searchQuery, setSearchQuery] = useState('')

   const [isLoading, setIsLoading] = useState(false)
   const [listError, setListError] = useState('')

   const [isModalOpen, setIsModalOpen] = useState(false)
   const [editingProduct, setEditingProduct] = useState<Product | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [submitError, setSubmitError] = useState('')
   const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

   type FormValues = {
      name: string
      code: string
      price: string
      description: string
      stock: string
   }

   const [formValues, setFormValues] = useState<FormValues>({
      name: '',
      code: '',
      price: '',
      description: '',
      stock: '',
   })

   const totalPages = useMemo(() => {
      const pages = Math.ceil(total / pageSize)
      return pages > 0 ? pages : 1
   }, [total])

   useEffect(() => {
      let isMounted = true

      async function loadProducts() {
         setIsLoading(true)
         setListError('')

         try {
            const response = await listProducts({
               page,
               size: pageSize,
               search: searchQuery,
            })

            if (!isMounted) {
               return
            }

            setProducts(response.items)
            setTotal(response.total)
         } catch (error) {
            if (!isMounted) {
               return
            }

            setListError(error.message || 'No se pudieron cargar los productos.')
         } finally {
            if (isMounted) {
               setIsLoading(false)
            }
         }
      }

      loadProducts()

      return () => {
         isMounted = false
      }
   }, [page, pageSize, searchQuery])

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
      setEditingProduct(null)
      setFormValues({
         name: '',
         code: '',
         price: '',
         description: '',
         stock: '',
      })
      setSubmitError('')
      setValidationErrors({})
      setIsModalOpen(true)
   }

   function openEditModal(product: Product) {
      setEditingProduct(product)
      setFormValues({
         name: product.name,
         code: product.code,
         price: String(product.price),
         description: product.description,
         stock: String(product.stock),
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
      const response = await listProducts({
         page,
         size: pageSize,
         search: searchQuery,
      })

      setProducts(response.items)
      setTotal(response.total)
   }

   async function handleSubmitProduct(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setIsSubmitting(true)
      setSubmitError('')
      setValidationErrors({})

      const payload: ProductInput = {
         name: formValues.name.trim(),
         code: formValues.code.trim(),
         price: Number(formValues.price),
         description: formValues.description.trim(),
         stock: Number(formValues.stock),
      }

      try {
         if (editingProduct) {
            await updateProduct(editingProduct.id, payload)
         } else {
            await createProduct(payload)
         }

         setIsModalOpen(false)
         await loadCurrentPage()
      } catch (error) {
         const backendFieldErrors = extractValidationErrors(error)

         if (Object.keys(backendFieldErrors).length > 0) {
            setValidationErrors(backendFieldErrors)
         } else {
            setSubmitError(error.message || 'No se pudo guardar el producto.')
         }
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleDelete(product: Product) {
      const approved = window.confirm(
         `Se eliminara el producto "${product.name}". Esta accion no se puede deshacer.`,
      )

      if (!approved) {
         return
      }

      try {
         await deleteProduct(product.id)

         if (products.length === 1 && page > 1) {
            setPage((prev) => prev - 1)
            return
         }

         await loadCurrentPage()
      } catch (error) {
         setListError(error.message || 'No se pudo eliminar el producto.')
      }
   }

   function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setPage(1)
      setSearchQuery(searchInput.trim())
   }

   const modalTitle = editingProduct ? 'Editar producto' : 'Crear producto'

   return (
      <section className={styles.wrapper}>
         <div className={styles.headerRow}>
            <div>
               <h1>Productos</h1>
               <p>Gestiona inventario con busqueda, paginacion y acciones CRUD.</p>
            </div>
            <Button type="button" onClick={openCreateModal}>
               Nuevo producto
            </Button>
         </div>

         <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
            <Input
               type="search"
               value={searchInput}
               onChange={(event) => setSearchInput(event.target.value)}
               placeholder="Buscar por nombre o codigo"
               aria-label="Buscar productos"
            />
            <Button type="submit" variant="secondary">
               Buscar
            </Button>
         </form>

         {listError ? <p className={styles.error}>{listError}</p> : null}

         <div className={styles.tableWrap}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Nombre</th>
                     <th>Codigo</th>
                     <th>Precio</th>
                     <th>Descripcion</th>
                     <th>Stock</th>
                     <th>Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan="5" className={styles.emptyCell}>
                           Cargando productos...
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading && products.length === 0 ? (
                     <tr>
                        <td colSpan="5" className={styles.emptyCell}>
                           No hay productos para mostrar.
                        </td>
                     </tr>
                  ) : null}

                  {!isLoading
                     ? products.map((product) => (
                        <tr key={product.id}>
                           <td>{product.name}</td>
                           <td>{product.code}</td>
                           <td>
                              {new Intl.NumberFormat('es-CO', {
                                 style: 'currency',
                                 currency: 'COP',
                                 maximumFractionDigits: 0,
                              }).format(product.price)}
                           </td>
                           <td>{product.description}</td>
                           <td>{product.stock}</td>
                           <td>
                              <div className={styles.actionsCell}>
                                 <Button type="button" variant="secondary" onClick={() => openEditModal(product)}>
                                    Editar
                                 </Button>
                                 <Button type="button" onClick={() => handleDelete(product)}>
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
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={modalTitle}>
               <div className={styles.modalCard}>
                  <h2>{modalTitle}</h2>

                  <form className={styles.modalForm} onSubmit={handleSubmitProduct}>
                     <label htmlFor="name">Nombre</label>
                     <Input
                        id="name"
                        name="name"
                        value={formValues.name}
                        onChange={handleChangeField}
                        placeholder="Ej. Cuaderno A4"
                        required
                     />
                     {validationErrors.name ? <p className={styles.fieldError}>{validationErrors.name}</p> : null}

                     <label htmlFor="code">Codigo</label>
                     <Input
                        id="code"
                        name="code"
                        value={formValues.code}
                        onChange={handleChangeField}
                        placeholder="PROD-001"
                        required
                     />
                     {validationErrors.code ? <p className={styles.fieldError}>{validationErrors.code}</p> : null}

                     <label htmlFor="price">Precio</label>
                     <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        value={formValues.price}
                        onChange={handleChangeField}
                        placeholder="0"
                        required
                     />
                     {validationErrors.price ? <p className={styles.fieldError}>{validationErrors.price}</p> : null}

                     <label htmlFor="description">Descripcion</label>
                     <Input
                         id="description"
                         name="description"
                         value={formValues.description}
                         onChange={handleChangeField}
                         placeholder="Añada Descripcion Producto"
                         required
                     />
                     {validationErrors.description ? <p className={styles.fieldError}>{validationErrors.description}</p> : null}

                     <label htmlFor="stock">Stock</label>
                     <Input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        value={formValues.stock}
                        onChange={handleChangeField}
                        placeholder="0"
                        required
                     />
                     {validationErrors.stock ? <p className={styles.fieldError}>{validationErrors.stock}</p> : null}

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

export default HomePage