import { Helmet } from 'react-helmet-async'

export default function NoSEO() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  )
}
