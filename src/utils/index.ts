export function currencyFormat(value: number, currency = 'USD', locale = 'en-US') {
   return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
   }).format(value)
}

export function cn(...classNames: Array<string | false | null | undefined>) {
   return classNames.filter(Boolean).join(' ')
}