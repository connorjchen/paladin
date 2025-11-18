import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { useCommunityColors } from '@/hooks/use-community-colors'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-b from-primary/80 via-primary to-primary/70 text-primary-foreground',
        secondary:
          'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        destructive:
          'border-transparent bg-gradient-to-b from-destructive/80 via-destructive to-destructive/70 text-destructive-foreground',
        outline: 'border border-gray-150 dark:border-gray-700 text-foreground',
        discord:
          'border-transparent bg-gradient-to-b from-[#5865F2]/20 via-[#5865F2]/30 to-[#5865F2]/20 text-[#5865F2]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  style,
  variant = 'default',
  ...props
}: BadgeProps) {
  const { accentColor, buttonTextColor } = useCommunityColors()

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
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ ...getDefaultVariantStyle(), ...style }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
