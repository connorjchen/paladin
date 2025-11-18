import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

export function LogoutPage() {
  const { signOut } = useAuth()

  useEffect(() => {
    void signOut()
  }, [signOut])

  return null
}
