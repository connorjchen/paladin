import React from 'react'
import { cn } from '@/lib/utils'

export interface ImagesGridItem {
  src: string
  alt?: string
  href?: string
}

interface ImagesGridProps {
  images: ImagesGridItem[]
  className?: string
}

export function ImagesGrid({ images, className }: ImagesGridProps) {
  if (!images || images.length === 0) return null

  if (images.length === 1) {
    const image = images[0]
    return (
      <a
        className="block"
        href={image.href ?? image.src}
        target="_blank"
        rel="noopener noreferrer"
        title={image.alt || 'Open image in new tab'}
      >
        <img
          src={image.src}
          alt={image.alt || 'Image'}
          className="my-4 block h-auto max-h-[400px] min-h-[150px] w-auto min-w-[150px] max-w-[400px] rounded-lg object-contain"
          onError={(e) => {
            // Hide broken images
            e.currentTarget.style.display = 'none'
          }}
        />
      </a>
    )
  }

  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
    >
      {images.map((img, idx) => (
        <a
          key={(img.src || '') + idx}
          href={img.href ?? img.src}
          target="_blank"
          rel="noopener noreferrer"
          title={img.alt || 'Open image in new tab'}
          className="group relative block overflow-hidden rounded-lg border bg-black/5 dark:bg-white/5"
        >
          <img
            src={img.src}
            alt={img.alt || 'Image'}
            className="h-48 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] sm:h-56"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </a>
      ))}
    </div>
  )
}
