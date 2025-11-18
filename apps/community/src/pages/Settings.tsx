import { ManageAdmins } from '@/components/custom/ManageAdmins'
import { ManageCommunityBranding } from '@/components/custom/ManageCommunityBranding'
import { Container } from '@/components/custom/Container'
import { H1 } from '@/components/custom/Text'
import { ManageDiscordIntegration } from '@/components/custom/ManageDiscordIntegration'
import { VFlex } from '@/components/custom/VFlex'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HFlex } from '@/components/custom/HFlex'
import { useIsMobile } from '@/hooks/use-mobile'
import { ManageContent } from '@/components/custom/ManageContent'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('discord')
  const isMobile = useIsMobile()

  const tabs = [
    {
      id: 'discord',
      label: 'Discord',
      component: <ManageDiscordIntegration />,
    },
    {
      id: 'branding',
      label: 'Branding',
      component: <ManageCommunityBranding />,
    },
    { id: 'content', label: 'Content', component: <ManageContent /> },
    { id: 'admins', label: 'Admins', component: <ManageAdmins /> },
    // { id: 'billing', label: 'Billing', component: <Billing /> },
  ]

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove the #
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActiveTab(hash)
      }
    }

    // Set initial tab from URL hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL hash when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    window.location.hash = tabId
  }

  return (
    <Container>
      <H1>Settings</H1>
      {isMobile ? (
        <VFlex className="w-full gap-4">
          <HFlex className="flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className="flex-shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </HFlex>
          <div className="w-full">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </VFlex>
      ) : (
        <HFlex className="w-full items-start gap-4">
          <VFlex className="gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className="w-fit justify-start"
              >
                {tab.label}
              </Button>
            ))}
          </VFlex>
          <div className="flex-1">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </HFlex>
      )}
    </Container>
  )
}
