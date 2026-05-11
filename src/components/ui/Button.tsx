import type { ButtonHTMLAttributes } from 'react'
import './button.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
   variant?: 'primary' | 'secondary'
}

function Button({ children, variant = 'primary', ...props }: ButtonProps) {
   return (
      <button className={`btn btn-${variant}`} {...props}>
         {children}
      </button>
   )
}

export default Button