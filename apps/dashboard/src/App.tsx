import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { NotFound } from './pages/404'
import { PrivacyPolicyPage } from './pages/PrivacyPolicy'
import { TermsOfServicePage } from './pages/TermsOfService'
import { OnboardingPage } from './pages/Onboarding'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<OnboardingPage />} />
          <Route path="terms-of-service" element={<TermsOfServicePage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
