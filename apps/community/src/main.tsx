import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import posthog from 'posthog-js'
import { isProduction } from './lib/utils'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string

if (!POSTHOG_KEY) {
  throw new Error('Missing Posthog Key')
}

if (isProduction()) {
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
  })
}

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(<App />)
