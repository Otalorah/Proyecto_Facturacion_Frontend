import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import styles from './styles.module.css'

function AboutPage() {
  useDocumentTitle('Acerca')

   return (
      <section className={styles.wrapper}>
      <h1>Acerca del proyecto</h1>
      <p>
         Esta base organiza la app por dominio: paginas, layouts, router, servicios,
         estado global y utilidades.
      </p>
      </section>
   )
}

export default AboutPage