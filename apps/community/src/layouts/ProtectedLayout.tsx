import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NoSEO from '@/components/custom/NoSEO'
import { Loading } from '@/components/custom/Loading'
import { useUserStore } from '@/stores/user'
import { emitToast } from '@/hooks/use-toast'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'

export function ProtectedLayout() {
  const navigate = useSubpathNavigate()
  const { isAuthSetup, isAuthed, user } = useUserStore()

  useEffect(() => {
    if (isAuthSetup && !isAuthed) {
      emitToast({
        title: 'Please log in',
        description: 'You must be logged in to view this page',
      })
      void navigate('/')
    }
  }, [isAuthSetup, isAuthed, navigate])

  if (!isAuthSetup || !isAuthed || !user?.id) return <Loading />

  return (
    <>
      <NoSEO />
      <Outlet />
    </>
  )
}
