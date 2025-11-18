import { SidebarTrigger } from '../ui/sidebar'
import { HFlex } from './HFlex'
import { ButtonWithIcon } from './ButtonWithIcon'
import { Plus, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SearchModal } from './SearchModal'
import { NewPostModal } from './NewPostModal'
import { useUserStore } from '@/stores/user'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'
import { useIsMobile } from '@/hooks/use-mobile'
import { ButtonIcon } from './ButtonIcon'
import { Logo } from './Logo'
import { SubpathLink } from './SubpathLink'
import { useCommunityStore } from '@/stores/community'

export function SidebarHeader() {
  const navigate = useSubpathNavigate()
  const { community } = useCommunityStore()
  const { isAuthed } = useUserStore()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchModalOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!community) {
    throw new Error('Community type-safe check')
  }

  return (
    <>
      <header className="border-sidebar-border h-16 shrink-0 border-b px-3 md:px-4">
        <HFlex className="h-full items-center justify-between">
          {/* Left section */}
          <HFlex className="h-full items-center gap-2">
            {isMobile ? (
              <SubpathLink to={'/'} className="block">
                <Logo className="h-7 w-auto" />
              </SubpathLink>
            ) : (
              <SidebarTrigger className="-ml-1" />
            )}
          </HFlex>

          {/* Right section */}
          <HFlex className="items-center gap-2">
            {isMobile ? (
              <>
                <ButtonIcon
                  variant="outline"
                  aria-label="Search"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </ButtonIcon>
                {community.isWebpageSubmissionsEnabled && (
                  <ButtonIcon
                    variant="default"
                    aria-label="New Post"
                    onClick={() =>
                      isAuthed
                        ? setIsNewPostModalOpen(true)
                        : navigate('/login')
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </ButtonIcon>
                )}
                <SidebarTrigger className="-mr-1" />
              </>
            ) : (
              <>
                <ButtonWithIcon
                  variant="outline"
                  icon={<Search />}
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  Search ⌘K
                </ButtonWithIcon>
                {community.isWebpageSubmissionsEnabled && (
                  <ButtonWithIcon
                    variant="default"
                    icon={<Plus />}
                    onClick={() =>
                      isAuthed
                        ? setIsNewPostModalOpen(true)
                        : navigate('/login')
                    }
                  >
                    New Post
                  </ButtonWithIcon>
                )}
              </>
            )}
          </HFlex>
        </HFlex>
      </header>

      <SearchModal open={isSearchModalOpen} setOpen={setIsSearchModalOpen} />
      <NewPostModal open={isNewPostModalOpen} setOpen={setIsNewPostModalOpen} />
    </>
  )
}
