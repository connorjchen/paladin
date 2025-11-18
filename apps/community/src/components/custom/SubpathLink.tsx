import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSubpathPath } from '@/lib/utils'

interface SubpathLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  to: string
}

export const SubpathLink = React.forwardRef<
  HTMLAnchorElement,
  SubpathLinkProps
>(({ children, to, className, onClick, ...props }, ref) => {
  const { serverSubpath } = useParams()
  return (
    <Link
      ref={ref}
      to={getSubpathPath(serverSubpath, to)}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  )
})
SubpathLink.displayName = 'SubpathLink'
