import { cn } from '@/lib/utils'

interface H1Props {
  children: React.ReactNode
  className?: string
}

interface H2Props {
  children: React.ReactNode
  className?: string
}

interface H3Props {
  children: React.ReactNode
  className?: string
}

interface P1Props {
  children: React.ReactNode
  className?: string
}

interface P2Props {
  children: React.ReactNode
  className?: string
  muted?: boolean
}

interface P3Props {
  children: React.ReactNode
  className?: string
}

export function H1({ children, className }: H1Props) {
  return (
    <h1 className={cn('text-foreground text-2xl font-bold', className)}>
      {children}
    </h1>
  )
}

export function H2({ children, className }: H2Props) {
  return (
    <h2 className={cn('text-foreground text-xl font-semibold', className)}>
      {children}
    </h2>
  )
}

export function H3({ children, className }: H3Props) {
  return (
    <h3 className={cn('text-foreground text-lg font-semibold', className)}>
      {children}
    </h3>
  )
}

export function P1({ children, className }: P1Props) {
  return (
    <p className={cn('text-foreground text-base', className)}>{children}</p>
  )
}

export function P2({ children, className, muted }: P2Props) {
  return (
    <p
      className={cn(
        'text-foreground text-sm',
        {
          'text-muted-foreground': muted,
        },
        className
      )}
    >
      {children}
    </p>
  )
}

export function P3({ children, className }: P3Props) {
  return <p className={cn('text-foreground text-xs', className)}>{children}</p>
}
