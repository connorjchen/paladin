import { getR2Url } from '@/lib/utils'
import { useCommunityStore } from '@/stores/community'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  imageUrl?: string
  ldJson?: Record<string, unknown>
  preloadImageUrl?: string
}

export default function SEO({
  title,
  description,
  imageUrl,
  ldJson,
  preloadImageUrl,
}: SEOProps) {
  const { community } = useCommunityStore()
  const communityName = community?.name
  const communityFavicon = getR2Url(community?.faviconR2Key) || '/favicon.ico'
  const canonicalUrl = window.location.origin + window.location.pathname

  const keywords = [
    `${communityName} support community`,
    `${communityName} help forum`,
    `${communityName} product discussions`,
    `${communityName} feature requests`,
    `${communityName} roadmap updates`,
    `${communityName} Q&A board`,
    `${communityName} feedback portal`,
    `${communityName} user group`,
    `${communityName} customer ideas`,
    `${communityName} community discussions`,
  ].join(', ')

  return (
    <Helmet>
      {ldJson && (
        <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
      )}

      {title && <title>{title}</title>}

      <link rel="canonical" href={canonicalUrl} />

      {/* Dynamic favicon from community logo */}
      <link rel="icon" type="image/x-icon" href={communityFavicon} />

      {/* Preloads primary image for faster loading LCP */}
      {preloadImageUrl && (
        <link rel="preload" href={preloadImageUrl} as="image" />
      )}

      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      <meta name="twitter:site" content="@connorjchen" />
      <meta name="twitter:url" content={canonicalUrl} />
    </Helmet>
  )
}
