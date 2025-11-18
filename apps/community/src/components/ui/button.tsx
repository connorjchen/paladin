import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { useCommunityColors } from '@/hooks/use-community-colors'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] hover:brightness-105 dark:hover:brightness-110 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive:
          'bg-gradient-to-b from-destructive/80 via-destructive to-destructive/70 text-destructive-foreground',
        outline:
          'border border-sidebar-border text-foreground hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        ghost:
          'shadow-none text-foreground hover:bg-accent hover:text-accent-foreground',
        discord: 'bg-gradient-to-b from-[#5865F2] to-[#4752C4] text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, style, variant = 'default', size, asChild = false, ...props },
    ref
  ) => {
    const { accentColor, buttonTextColor } = useCommunityColors()
    const Comp = asChild ? Slot : 'button'

    const getDefaultVariantStyle = () => {
      if (variant === 'default') {
        return {
          background: `linear-gradient(to bottom, ${accentColor}cc, ${accentColor}, ${accentColor}b3)`,
          color: buttonTextColor,
        }
      }
      return {}
    }

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            className,
          })
        )}
        style={{ ...getDefaultVariantStyle(), ...style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
