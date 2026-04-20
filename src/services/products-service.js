import { apiClient } from './apiClient'
import { USE_MOCK_API } from '../config/feature-flags'

const MOCK_PRODUCTS = USE_MOCK_API
const MOCK_LATENCY_MS = 450
const MOCK_PRODUCTS_KEY = 'mock.products.items'
const MOCK_NEXT_ID_KEY = 'mock.products.nextId'

const MOCK_SEED_PRODUCTS = [
   { id: '1', name: 'Cuaderno A4', sku: 'PROD-001', price: 12500, stock: 22 },
   { id: '2', name: 'Lapicero Azul', sku: 'PROD-002', price: 2500, stock: 140 },
   { id: '3', name: 'Lapicero Negro', sku: 'PROD-003', price: 2500, stock: 115 },
   { id: '4', name: 'Resaltador', sku: 'PROD-004', price: 4200, stock: 56 },
   { id: '5', name: 'Carpeta Oficio', sku: 'PROD-005', price: 9800, stock: 38 },
   { id: '6', name: 'Marcador Borrable', sku: 'PROD-006', price: 6900, stock: 28 },
   { id: '7', name: 'Borrador Blanco', sku: 'PROD-007', price: 1800, stock: 90 },
   { id: '8', name: 'Regla 30 cm', sku: 'PROD-008', price: 3300, stock: 46 },
   { id: '9', name: 'Tijera Escolar', sku: 'PROD-009', price: 5400, stock: 31 },
   { id: '10', name: 'Colbon 125 ml', sku: 'PROD-010', price: 5100, stock: 27 },
   { id: '11', name: 'Block Carta', sku: 'PROD-011', price: 7600, stock: 62 },
   { id: '12', name: 'Cartulina Blanca', sku: 'PROD-012', price: 1900, stock: 175 },
   { id: '13', name: 'Folder Amarillo', sku: 'PROD-013', price: 1600, stock: 84 },
   { id: '14', name: 'Grapadora Mini', sku: 'PROD-014', price: 14200, stock: 12 },
   { id: '15', name: 'Cinta Transparente', sku: 'PROD-015', price: 3700, stock: 52 },
]

function toNumber(value, fallback = 0) {
   const num = Number(value)
   return Number.isFinite(num) ? num : fallback
}

function mapProduct(raw) {
   if (!raw) {
      return {
         id: '',
         name: '',
         sku: '',
         price: 0,
         stock: 0,
      }
   }

   return {
      id: raw.id ?? raw.productId ?? '',
      name: raw.name ?? raw.nombre ?? '',
      sku: raw.sku ?? raw.code ?? '',
      price: toNumber(raw.price ?? raw.precio, 0),
      stock: toNumber(raw.stock ?? raw.inventory ?? 0, 0),
   }
}

function wait(ms) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms)
   })
}

function createApiError({ message, status = 400, details = null }) {
   const error = new Error(message)
   error.name = 'ApiError'
   error.status = status
   error.details = details
   return error
}

function readMockProducts() {
   const stored = localStorage.getItem(MOCK_PRODUCTS_KEY)

   if (!stored) {
      localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(MOCK_SEED_PRODUCTS))
      localStorage.setItem(MOCK_NEXT_ID_KEY, String(MOCK_SEED_PRODUCTS.length + 1))
      return [...MOCK_SEED_PRODUCTS]
   }

   try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
         throw new Error('Invalid mock data')
      }
      return parsed.map(mapProduct)
   } catch {
      localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(MOCK_SEED_PRODUCTS))
      localStorage.setItem(MOCK_NEXT_ID_KEY, String(MOCK_SEED_PRODUCTS.length + 1))
      return [...MOCK_SEED_PRODUCTS]
   }
}

function writeMockProducts(items) {
   localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(items))
}

function getNextMockId() {
   const stored = localStorage.getItem(MOCK_NEXT_ID_KEY)
   const next = toNumber(stored, MOCK_SEED_PRODUCTS.length + 1)
   localStorage.setItem(MOCK_NEXT_ID_KEY, String(next + 1))
   return String(next)
}

function normalizeProductInput(data) {
   return {
      name: String(data?.name || '').trim(),
      sku: String(data?.sku || '').trim(),
      price: toNumber(data?.price, Number.NaN),
      stock: toNumber(data?.stock, Number.NaN),
   }
}

function validateProductInput(data, existingItems, currentId = null) {
   const product = normalizeProductInput(data)
   const fieldErrors = {}

   if (!product.name) {
      fieldErrors.name = 'El nombre es obligatorio.'
   }

   if (!product.sku) {
      fieldErrors.sku = 'El SKU es obligatorio.'
   }

   if (!Number.isFinite(product.price) || product.price < 0) {
      fieldErrors.price = 'El precio debe ser un numero mayor o igual a 0.'
   }

   if (!Number.isInteger(product.stock) || product.stock < 0) {
      fieldErrors.stock = 'El stock debe ser un entero mayor o igual a 0.'
   }

   const duplicate = existingItems.find((item) => {
      if (currentId && String(item.id) === String(currentId)) {
         return false
      }

      return String(item.sku).toLowerCase() === product.sku.toLowerCase()
   })

   if (duplicate) {
      fieldErrors.sku = 'El SKU ya existe en otro producto.'
   }

   if (Object.keys(fieldErrors).length > 0) {
      throw createApiError({
         message: 'Revisa los datos del formulario.',
         status: 400,
         details: {
            validationErrors: fieldErrors,
         },
      })
   }

   return product
}

function normalizeListPayload(payload, fallbackPage, fallbackSize) {
   if (Array.isArray(payload)) {
      const items = payload.map(mapProduct)

      return {
         items,
         total: items.length,
         page: fallbackPage,
         size: fallbackSize,
      }
   }

   const candidates = [
      payload,
      payload?.data,
      payload?.result,
   ]

   for (const candidate of candidates) {
      if (!candidate) continue

      const rawItems = candidate.items || candidate.content || candidate.rows

      if (Array.isArray(rawItems)) {
         return {
            items: rawItems.map(mapProduct),
            total: toNumber(candidate.total ?? candidate.totalElements, rawItems.length),
            page: toNumber(candidate.page ?? candidate.number, fallbackPage),
            size: toNumber(candidate.size, fallbackSize),
         }
      }
   }

   return {
      items: [],
      total: 0,
      page: fallbackPage,
      size: fallbackSize,
   }
}

export async function listProducts({ page = 1, size = 10, search = '' } = {}) {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const safePage = Math.max(1, toNumber(page, 1))
      const safeSize = Math.max(1, toNumber(size, 10))
      const searchText = search.trim().toLowerCase()

      const source = readMockProducts()
      const filtered = searchText
         ? source.filter((item) => {
            const name = String(item.name || '').toLowerCase()
            const sku = String(item.sku || '').toLowerCase()
            return name.includes(searchText) || sku.includes(searchText)
         })
         : source

      const total = filtered.length
      const start = (safePage - 1) * safeSize
      const items = filtered.slice(start, start + safeSize).map(mapProduct)

      return {
         items,
         total,
         page: safePage,
         size: safeSize,
      }
   }

   const params = new URLSearchParams({
      page: String(page),
      size: String(size),
   })

   if (search.trim()) {
      params.set('search', search.trim())
   }

   const payload = await apiClient(`/products?${params.toString()}`)
   return normalizeListPayload(payload, page, size)
}

export async function createProduct(data) {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const normalized = validateProductInput(data, items)

      const created = {
         id: getNextMockId(),
         ...normalized,
      }

      writeMockProducts([...items, created])
      return mapProduct(created)
   }

   const payload = await apiClient('/products', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return mapProduct(payload?.data || payload)
}

export async function updateProduct(id, data) {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const index = items.findIndex((item) => String(item.id) === String(id))

      if (index === -1) {
         throw createApiError({
            message: 'Producto no encontrado.',
            status: 404,
         })
      }

      const normalized = validateProductInput(data, items, id)
      const updated = {
         ...items[index],
         ...normalized,
      }

      const nextItems = [...items]
      nextItems[index] = updated
      writeMockProducts(nextItems)

      return mapProduct(updated)
   }

   const payload = await apiClient(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
   })

   return mapProduct(payload?.data || payload)
}

export async function deleteProduct(id) {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const exists = items.some((item) => String(item.id) === String(id))

      if (!exists) {
         throw createApiError({
            message: 'Producto no encontrado.',
            status: 404,
         })
      }

      writeMockProducts(items.filter((item) => String(item.id) !== String(id)))
      return
   }

   await apiClient(`/products/${id}`, {
      method: 'DELETE',
   })
}
