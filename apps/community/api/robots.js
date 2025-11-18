export default function handler(req, res) {
  // Detect the original host
  const host = req.headers['x-forwarded-host'] || req.headers['host']
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const origin = `${proto}://${host}`

  const content = `
  User-agent: *
  Disallow:
  
  Sitemap: ${origin}/sitemap.xml
    `.trim()

  res.setHeader('Content-Type', 'text/plain')
  res.status(200).send(content)
}
