interface ColorInputProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  className?: string
}

export function ColorInput({
  value,
  onChange,
  disabled = false,
  className = '',
}: ColorInputProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`h-12 w-12 cursor-pointer bg-transparent ${className}`}
      title="Select color"
    />
  )
}
