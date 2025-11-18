// /api/sitemap/[name].js
export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers['host']
  const proto = req.headers['x-forwarded-proto'] || 'https'

  const { num } = req.query

  const backendUrl = `https://api.trypaladin.com/internal/sitemap/index/${num}` // TODO: replace with your backend URL

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers: {
      'x-original-host': host,
      'x-original-proto': proto,
      'content-type': req.headers['content-type'] || 'application/xml',
    },
  })

  const body = await backendRes.text()

  res.status(backendRes.status)
  res.setHeader(
    'Content-Type',
    backendRes.headers.get('content-type') || 'application/xml'
  )
  res.send(body)
}
