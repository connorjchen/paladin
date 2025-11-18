import { useEffect } from 'react'
import { useAuth, useClerk, useSignIn } from '@clerk/clerk-react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { handleError, setupAxiosAuth } from '@/lib/utils'
import posthog from 'posthog-js'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'

export function AuthLayout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const signInToken = searchParams.get('token')
  const { getToken, userId: clerkUserId, isLoaded, isSignedIn } = useAuth()
  const { user: clerkUser } = useClerk()
  const { user, getUser, setAuthSetup, isAuthSetup, setIsAuthed } =
    useUserStore()
  const { signIn, setActive } = useSignIn()
  const { community } = useCommunityStore()

  // Manually manage auth state bc Clerk hooks lag behind
  useEffect(() => {
    setIsAuthed(isSignedIn ?? false)
  }, [isSignedIn, setIsAuthed])

  // Handle one time sign in tokens
  useEffect(() => {
    if (!signIn || !setActive || !isLoaded || isAuthSetup || !community) {
      return
    }

    const createSignIn = async () => {
      try {
        if (signInToken && !isSignedIn) {
          const signInAttempt = await signIn.create({
            strategy: 'ticket',
            ticket: signInToken,
          })

          if (signInAttempt.status === 'complete') {
            await setActive({
              session: signInAttempt.createdSessionId,
            })
            setupAxiosAuth(getToken)
            setIsAuthed(true)
          } else {
            handleError({
              error: signInAttempt,
              toastTitle: 'Sign in failed',
            })
          }
        } else {
          setupAxiosAuth(getToken)
        }
      } catch (err) {
        handleError({
          error: err,
          toastTitle: 'Sign in failed',
        })
      } finally {
        setAuthSetup(true)
        if (signInToken) {
          searchParams.delete('token')
          setSearchParams(searchParams)
        }
      }
    }

    void createSignIn()
  }, [
    setIsAuthed,
    signIn,
    setActive,
    signInToken,
    user,
    getToken,
    setAuthSetup,
    clerkUserId,
    searchParams,
    setSearchParams,
    isSignedIn,
    isAuthSetup,
    isLoaded,
    community,
  ])

  useEffect(() => {
    if (clerkUserId && clerkUser && !user) {
      posthog.identify(clerkUserId)
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress ?? ''
      void getUser({
        primaryEmail,
        emails: clerkUser.emailAddresses
          .filter((email) => email.verification?.status === 'verified')
          .map((email) => email.emailAddress),
        image: clerkUser.imageUrl ?? '',
      })
    }
  }, [clerkUserId, getUser, user, clerkUser])

  if (!isAuthSetup) {
    return null
  } else {
    return <Outlet />
  }
}
