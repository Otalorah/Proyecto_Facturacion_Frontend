export function currencyFormat(value, currency = 'USD', locale = 'en-US') {
   return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
   }).format(value)
}

export function cn(...classNames) {
   return classNames.filter(Boolean).join(' ')
}