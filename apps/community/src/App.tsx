import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { NotFound } from './pages/404'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { LoginSignupPage } from './pages/LoginSignup'
import { HomePage } from './pages/Home'
import { SidebarLayout } from './layouts/SidebarLayout'
import { RoadmapPage } from './pages/Roadmap'
import { MyPostsPage } from './pages/MyPosts'
import { FollowingPage } from './pages/Following'
import { PostPage } from './pages/Post'
import { ReviewPostsPage } from './pages/ReviewPosts'
import { SettingsPage } from './pages/Settings'
import { LogoutPage } from './pages/Logout'
import { SupportAgentPage } from './pages/SupportAgent'

function App() {
  return (
    <Router>
      <Routes>
        {/* Root routes */}
        <Route path="" element={<RootLayout />}>
          <Route path="" element={<AuthLayout />}>
            <Route path="login" element={<LoginSignupPage type="login" />} />
            <Route path="signup" element={<LoginSignupPage type="signup" />} />
            <Route path="logout" element={<LogoutPage />} />
            <Route path="" element={<SidebarLayout />}>
              <Route index element={<HomePage />} />
              <Route path="roadmap" element={<RoadmapPage />} />
              <Route path="post/:postId" element={<PostPage />} />
              <Route path="" element={<ProtectedLayout />}>
                <Route path="my-posts" element={<MyPostsPage />} />
                <Route path="following" element={<FollowingPage />} />
                <Route path="review-posts" element={<ReviewPostsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="support-agent" element={<SupportAgentPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Subdomain routes */}
        <Route path="/s/:serverSubpath/*" element={<RootLayout />}>
          <Route path="" element={<AuthLayout />}>
            <Route path="login" element={<LoginSignupPage type="login" />} />
            <Route path="signup" element={<LoginSignupPage type="signup" />} />
            <Route path="logout" element={<LogoutPage />} />
            <Route path="" element={<SidebarLayout />}>
              <Route index element={<HomePage />} />
              <Route path="roadmap" element={<RoadmapPage />} />
              <Route path="post/:postId" element={<PostPage />} />
              <Route path="" element={<ProtectedLayout />}>
                <Route path="my-posts" element={<MyPostsPage />} />
                <Route path="following" element={<FollowingPage />} />
                <Route path="review-posts" element={<ReviewPostsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="support-agent" element={<SupportAgentPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
