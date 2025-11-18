export default async function handler(req, res) {
  // Preserve the original host and protocol
  const host = req.headers['x-forwarded-host'] || req.headers['host']
  const proto = req.headers['x-forwarded-proto'] || 'https'

  // Forward the request to your backend
  const backendUrl = `https://api.trypaladin.com/internal/sitemap`

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers: {
      'x-original-host': host,
      'x-original-proto': proto,
      'content-type': req.headers['content-type'] || 'application/json',
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
