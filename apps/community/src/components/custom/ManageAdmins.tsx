import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import { HFlex } from '@/components/custom/HFlex'
import { SingleAvatar } from '@/components/custom/SingleAvatar'
import { Pagination } from '@/components/custom/Pagination'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@prisma/client'
import { BasicUser, Feature } from '@paladin/shared'
import { H2, P1, P2 } from '@/components/custom/Text'
import { useFeature } from '@/hooks/use-feature'

export function ManageAdmins() {
  const [searchTerm, setSearchTerm] = useState('')
  const [communityUsers, setCommunityUsers] = useState<BasicUser[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const { user: currentUser, getCommunityUsers, setUserRole } = useUserStore()
  const { getValue } = useFeature()

  const usersPerPage = 5

  async function getUsers() {
    const result = await getCommunityUsers()
    if (result.data) {
      setCommunityUsers(result.data)
    }
  }

  useEffect(() => {
    getUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase()
    return communityUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTermLower) ||
        user.primaryEmail.toLowerCase().includes(searchTermLower)
    )
  }, [communityUsers, searchTerm])

  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const usersToShow = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const maxAdmins = getValue(Feature.MAX_ADMINS) as number
  const currentAdminCount = communityUsers.filter(
    (user) => user.role === UserRole.ADMIN
  ).length

  const handleSetUserRole = async (userId: string, role: UserRole) => {
    await setUserRole(userId, { role })
    await getUsers()
  }

  return (
    <VFlex className="gap-4">
      <H2>Manage Admins</H2>
      <Input
        type="search"
        placeholder="Search users by username or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <HFlex className="gap-2">
        <P2 muted>
          Showing {usersToShow.length} out of {filteredUsers.length} users
        </P2>
        <P2 className="text-orange-600">(Admin limit: {maxAdmins})</P2>
      </HFlex>
      <VFlex className="gap-4">
        {usersToShow.map((user) => (
          <Card key={user.id} className="p-4">
            <VFlex className="gap-2 sm:flex-row sm:justify-between">
              <HFlex className="gap-2">
                <SingleAvatar
                  src={user.image}
                  fallback={user.username.charAt(0)}
                  alt={user.username}
                />
                <VFlex className="gap-1">
                  <P1>{user.username}</P1>
                  <P2 muted>{user.primaryEmail}</P2>
                </VFlex>
              </HFlex>
              <Button
                disabled={
                  currentUser?.id === user.id ||
                  (user.role !== UserRole.ADMIN &&
                    currentAdminCount >= maxAdmins)
                }
                variant={
                  user.role === UserRole.ADMIN ? 'destructive' : 'default'
                }
                onClick={() =>
                  handleSetUserRole(
                    user.id,
                    user.role === UserRole.ADMIN
                      ? UserRole.MEMBER
                      : UserRole.ADMIN
                  )
                }
              >
                {user.role === UserRole.ADMIN ? 'Remove Admin' : 'Make Admin'}
              </Button>
            </VFlex>
          </Card>
        ))}
      </VFlex>
      <Pagination
        currentPage={currentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={usersPerPage}
        onPageChange={setCurrentPage}
      />
    </VFlex>
  )
}
