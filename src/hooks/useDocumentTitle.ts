import { useEffect } from 'react'

const DEFAULT_TITLE = 'FacturaApp'

export function useDocumentTitle(pageTitle?: string) {
   useEffect(() => {
      if (!pageTitle) {
         document.title = DEFAULT_TITLE
         return
      }

      document.title = `${pageTitle} | ${DEFAULT_TITLE}`
   }, [pageTitle])
}