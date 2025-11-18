import { type LucideIcon } from 'lucide-react'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLocation } from 'react-router-dom'
import { useCommunityColors } from '@/hooks/use-community-colors'
import { SubpathLink } from '../custom/SubpathLink'

interface NavTabsProps {
  title: string
  tabs: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}

export function NavTabs({ title, tabs }: NavTabsProps) {
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  const { accentColor } = useCommunityColors()

  if (!tabs || tabs.length === 0) return null

  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    setOpenMobile(false)
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        <SidebarMenuButton disabled>
          <span className="text-muted-foreground font-semibold">{title}</span>
        </SidebarMenuButton>
        {tabs.map((item) => {
          const isActive = location.pathname === item.url
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className="font-medium"
              >
                {item.url.startsWith('http') ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    style={isActive ? { color: accentColor } : undefined}
                  >
                    <item.icon
                      style={isActive ? { color: accentColor } : undefined}
                    />
                    <span>{item.name}</span>
                  </a>
                ) : (
                  <SubpathLink to={item.url} onClick={handleLinkClick}>
                    <item.icon
                      style={isActive ? { color: accentColor } : undefined}
                    />
                    <span style={isActive ? { color: accentColor } : undefined}>
                      {item.name}
                    </span>
                  </SubpathLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
