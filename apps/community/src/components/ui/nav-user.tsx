'use client'

import { BadgeCheck, LogOut } from 'lucide-react'

import { SingleAvatar } from '@/components/custom/SingleAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useClerk } from '@clerk/clerk-react'
import { useUserStore } from '@/stores/user'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'

interface NavUserProps {
  name: string
  email: string
  image: string
}

export function NavUser({ name, email, image }: NavUserProps) {
  const { signOut, openUserProfile } = useClerk()
  const navigate = useSubpathNavigate()
  const { clearUser } = useUserStore()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-background-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <SingleAvatar
                src={image}
                alt={name}
                fallback={name[0]}
                className="h-8 w-8"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => openUserProfile()}
                className="cursor-pointer"
              >
                <BadgeCheck />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut()
                clearUser()
                void navigate('/')
              }}
              className="cursor-pointer"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
