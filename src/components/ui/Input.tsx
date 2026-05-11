import type { InputHTMLAttributes } from 'react'
import './input.css'

type InputProps = InputHTMLAttributes<HTMLInputElement>

function Input(props: InputProps) {
  return <input className="ui-input" {...props} />
}

export default Input