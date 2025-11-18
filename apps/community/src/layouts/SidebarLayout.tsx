import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SidebarHeader } from '@/components/custom/SidebarHeader'

export function SidebarLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
