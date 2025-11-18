import { Router, Request } from 'express'
import { asyncHandler } from '../../utils'
import { CustomResponse } from '../../utils'
import prisma from '../../prisma/client'

const router: Router = Router()
const MAX_URLS = 50000

async function getCommunityPages(host: string): Promise<string[]> {
  if (host === 'community.trypaladin.com') {
    // Main Paladin page or subpages
    const communities = await prisma.community.findMany({
      where: {
        AND: [
          { domain: { not: 'localhost:4200' } },
          {
            OR: [
              { domain: 'community.trypaladin.com' },
              { domain: { not: { contains: '.' } } },
            ],
          },
        ],
      },
      include: {
        posts: {
          where: { private: false },
        },
      },
    })

    if (!communities) {
      throw new Error('Communities not found')
    }

    const filteredCommunities = communities.filter(
      (community) => community.posts.length > 0
    )

    const links: string[] = ['/', '/roadmap']
    filteredCommunities.forEach((community) => {
      links.push(`/s/${community.domain}`)

      community.posts.forEach((post) => {
        links.push(`/s/${community.domain}/post/${post.id}`)
      })

      if (community.isRoadmapEnabled) {
        links.push(`/s/${community.domain}/roadmap`)
      }
    })

    return links
  } else {
    // Other custom domains
    const community = await prisma.community.findUniqueOrThrow({
      where: {
        domain: host,
      },
      include: {
        posts: {
          where: {
            private: false,
          },
        },
      },
    })

    const links: string[] = ['/']
    community.posts.forEach((post) => {
      links.push(`/post/${post.id}`)
    })
    if (community.isRoadmapEnabled) {
      links.push('/roadmap')
    }

    return links
  }
}

router.get(
  '/',
  asyncHandler(async (req: Request, res: CustomResponse<string>) => {
    const host = req.headers['x-original-host']
    const proto = req.headers['x-original-proto']

    if (
      typeof host !== 'string' ||
      typeof proto !== 'string' ||
      !host ||
      !proto
    ) {
      throw new Error('Host and proto must be non-empty strings')
    }

    const pages = await getCommunityPages(host)

    if (pages.length <= MAX_URLS) {
      return res
        .type('application/xml')
        .status(200)
        .send(buildSitemap(proto, host, pages))
    }

    const chunks = Math.ceil(pages.length / MAX_URLS)
    return res
      .type('application/xml')
      .status(200)
      .send(buildSitemapIndex(proto, host, chunks))
  })
)

router.get(
  '/index/:num',
  asyncHandler(async (req: Request, res: CustomResponse<string>) => {
    const num = parseInt(req.params.num, 10)

    const host = req.headers['x-original-host']
    const proto = req.headers['x-original-proto']

    if (
      typeof host !== 'string' ||
      typeof proto !== 'string' ||
      !host ||
      !proto
    ) {
      throw new Error('Host and proto must be non-empty strings')
    }

    const pages = await getCommunityPages(host)
    const start = (num - 1) * MAX_URLS
    const end = start + MAX_URLS
    const slice = pages.slice(start, end)

    return res
      .type('application/xml')
      .status(200)
      .send(buildSitemap(proto, host, slice))
  })
)

function buildSitemap(proto: string, host: string, pages: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (path) => `<url>
    <loc>${proto}://${host}${path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
    )
    .join('')}
  </urlset>`
}

function buildSitemapIndex(
  proto: string,
  host: string,
  chunks: number
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Array.from({ length: chunks }, (_, i) => i + 1)
    .map(
      (n) => `<sitemap>
    <loc>${proto}://${host}/sitemap-${n}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
    )
    .join('')}
  </sitemapindex>`
}

export { router as sitemapRoutes }
