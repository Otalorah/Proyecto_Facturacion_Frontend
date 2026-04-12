import { useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import styles from './styles.module.css'

function HomePage() {
  const [companyName, setCompanyName] = useState('')
  useDocumentTitle('Inicio')

   const greeting = useMemo(() => {
      if (!companyName.trim()) return 'Tu panel base esta listo.'
      return `Bienvenido, ${companyName.trim()}.`
   }, [companyName])

   return (
      <section className={styles.wrapper}>
      <h1>Inicio</h1>
      <p>{greeting}</p>

      <div className={styles.card}>
         <label htmlFor="companyName">Nombre de la empresa</label>
         <Input
            id="companyName"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Ej. Facturacion El Sol"
         />
         <Button type="button">Guardar borrador</Button>
      </div>
      </section>
   )
}

export default HomePage