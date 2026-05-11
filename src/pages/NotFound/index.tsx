import { Link } from 'react-router-dom'
import styles from './styles.module.css'

function NotFoundPage() {
  return (
    <section className={styles.wrapper}>
      <h1>404</h1>
      <p>La pagina que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  )
}

export default NotFoundPage