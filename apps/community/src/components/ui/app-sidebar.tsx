import * as React from 'react'
import {
  ArrowUpRight,
  Bot,
  ChartBar,
  CreditCard,
  Globe,
  Home,
  Map,
  MessageSquare,
  Settings,
  Shield,
  User,
} from 'lucide-react'

import { NavTabs } from '@/components/ui/nav-tabs'
import { NavUser } from '@/components/ui/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Link, useParams } from 'react-router-dom'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { Button } from './button'
import { Logo } from '../custom/Logo'
import { BasicExternalResource, Feature } from '@paladin/shared'
import { UserRole } from '@prisma/client'
import { useFeature } from '@/hooks/use-feature'
import { getSubpathPath } from '@/lib/utils'
import { SubpathLink } from '../custom/SubpathLink'
import { useEffect, useState } from 'react'
import { useDiscordStore } from '@/stores/discord'
import { ButtonWithIcon } from '../custom/ButtonWithIcon'
import { ThemeToggle } from '@/components/custom/ThemeToggle'
import { HFlex } from '@/components/custom/HFlex'
import { FaDiscord } from 'react-icons/fa'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUserStore()
  const { community } = useCommunityStore()
  const { getDiscordInviteLink } = useDiscordStore()
  const { isEnabled } = useFeature()
  const [discordInviteLink, setDiscordInviteLink] = useState<string | null>(
    null
  )

  if (!community) {
    return null
  }

  useEffect(() => {
    getDiscordInviteLink().then((res) => {
      if (res.data) {
        setDiscordInviteLink(res.data.inviteLink || null)
      }
    })
  }, [getDiscordInviteLink])

  const isWebpageSubmissionsEnabled = community.isWebpageSubmissionsEnabled
  const enableAIAgent = isEnabled(Feature.SUPPORT_AGENT)
  const enableRoadmap = community.isRoadmapEnabled
  const noPaladinWatermark =
    community.domain === 'community.trypaladin.com' ||
    community.domain === 'localhost:4200'
      ? false
      : isEnabled(Feature.NO_PALADIN_WATERMARK)

  const data = {
    discussions: [
      {
        name: 'Home',
        url: `/`,
        icon: Home,
      },
      ...(enableRoadmap
        ? [
            {
              name: 'Roadmap',
              url: `/roadmap`,
              icon: Map,
            },
          ]
        : []),
    ],
    myActivity: [
      ...(isWebpageSubmissionsEnabled
        ? [
            {
              name: 'My Posts',
              url: `/my-posts`,
              icon: User,
            },
          ]
        : []),
      {
        name: 'Following',
        url: `/following`,
        icon: MessageSquare,
      },
    ],
    admin: [
      {
        name: 'Review Posts',
        url: `/review-posts`,
        icon: Shield,
      },
      ...(enableAIAgent
        ? [
            {
              name: 'Support Agent',
              url: `/support-agent`,
              icon: Bot,
            },
          ]
        : []),
      {
        name: 'Settings',
        url: `/settings`,
        icon: Settings,
      },
      {
        name: 'Support & Feedback',
        url: `https://community.trypaladin.com`,
        icon: Globe,
      },
    ],
    footer:
      community?.externalResources?.map((resource: BasicExternalResource) => ({
        name: resource.name,
        url: resource.url,
        icon: ArrowUpRight,
      })) ?? [],
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SubpathLink to={'/'} className="block">
          <Logo className="h-24 w-full cursor-pointer object-contain" />
        </SubpathLink>
      </SidebarHeader>
      <SidebarContent>
        <NavTabs tabs={data.discussions} title="Discussions" />
        {user && <NavTabs tabs={data.myActivity} title="My Activity" />}
        {user && user.role === UserRole.ADMIN && (
          <NavTabs tabs={data.admin} title="Admin" />
        )}
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavTabs tabs={data.footer} title="Resources" />
        {!noPaladinWatermark && (
          <HFlex className="px-2 pb-2 justify-between">
            <SidebarMenuButton asChild className="w-fit">
              <a
                href="https://trypaladin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:bg-muted rounded-md px-3 py-2 text-xs font-semibold opacity-50 transition-colors duration-150 hover:text-black"
              >
                Powered by Paladin
              </a>
            </SidebarMenuButton>
            <ThemeToggle />
          </HFlex>
        )}
        {discordInviteLink && (
          <ButtonWithIcon
            className="mx-2"
            variant="discord"
            icon={<FaDiscord />}
            onClick={() => window.open(discordInviteLink, '_blank')}
          >
            Join Discord
          </ButtonWithIcon>
        )}
        {user ? (
          <NavUser
            image={user.image}
            name={user.username}
            email={user.primaryEmail}
          />
        ) : (
          <Button className="m-2" asChild>
            <SubpathLink to={'/login'}>Sign In</SubpathLink>
          </Button>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
