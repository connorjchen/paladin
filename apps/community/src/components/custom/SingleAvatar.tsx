import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export interface SingleAvatarProps {
  src: string
  fallback: string
  className?: string
  alt?: string
}

export function SingleAvatar({
  src,
  fallback,
  className,
  alt,
}: SingleAvatarProps) {
  return (
    <Avatar className={`${className || ''}`}>
      <AvatarImage src={src} alt={alt || fallback} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
