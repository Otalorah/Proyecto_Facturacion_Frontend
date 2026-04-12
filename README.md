# Proyecto Facturacion - Frontend

Base inicial del frontend

## Stack

- React 19
- Vite 8
- React Router DOM
- ESLint
- PNPM

## Scripts

- `pnpm dev`: levanta el entorno de desarrollo.
- `pnpm build`: genera build de produccion.
- `pnpm preview`: sirve la build localmente.
- `pnpm lint`: ejecuta analisis estatico.

## Estructura

```text
src/
	assets/                  # imagenes, fuentes y recursos estaticos
	components/
		ui/                    # componentes reutilizables (Button, Input, etc.)
	hooks/                   # custom hooks
	layouts/                 # layouts de aplicacion (MainLayout, AuthLayout)
	pages/                   # una carpeta por ruta
		Home/
			index.jsx
			styles.module.css
		About/
			index.jsx
			styles.module.css
		NotFound/
			index.jsx
			styles.module.css
	router/                  # definicion de rutas
	services/                # llamadas HTTP
	store/                   # estado global (context/redux)
	utils/                   # helpers
	App.jsx
	main.jsx
```

## Variables de entorno

1. Copiar `.env.example` a `.env`.
2. Ajustar el valor de `VITE_API_URL`.

Ejemplo:

```env
VITE_API_URL=http://localhost:3000
``
