import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VFlex } from '@/components/custom/VFlex'
import { HFlex } from '@/components/custom/HFlex'
import { useExternalResourceStore } from '@/stores/externalResource'
import { useCommunityStore } from '@/stores/community'
import { H2, H3, P1 } from './Text'

export function ManageExternalResources() {
  const { community, getCommunity } = useCommunityStore()
  const {
    createExternalResource,
    updateExternalResource,
    deleteExternalResource,
  } = useExternalResourceStore()
  const resources = community?.externalResources ?? []
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newResource, setNewResource] = useState({ name: '', url: '' })
  const [editResource, setEditResource] = useState({ name: '', url: '' })
  const [loading, setLoading] = useState(false)

  const populateResources = async () => {
    // DEBT: Refresh community to update resources (not ideal flow, but works)
    await getCommunity()
  }

  useEffect(() => {
    populateResources()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newResource.name.trim() || !newResource.url.trim()) return
    setLoading(true)
    await createExternalResource(newResource)
    await populateResources()
    setNewResource({ name: '', url: '' })
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    await deleteExternalResource(id)
    await populateResources()
    setLoading(false)
  }

  const handleEdit = (id: string) => {
    const res = resources.find((r) => r.id === id)
    if (res) {
      setEditingId(id)
      setEditResource({ name: res.name, url: res.url })
    }
  }

  const handleEditSave = async (id: string) => {
    setLoading(true)
    await updateExternalResource(id, editResource)
    await populateResources()
    setEditingId(null)
    setLoading(false)
  }

  return (
    <VFlex className="gap-4">
      <H3>External Resources</H3>
      <VFlex className="gap-2">
        <HFlex className="gap-2">
          <Input
            placeholder="Name"
            value={newResource.name}
            onChange={(e) =>
              setNewResource({ ...newResource, name: e.target.value })
            }
            disabled={loading}
          />
          <Input
            placeholder="URL"
            value={newResource.url}
            onChange={(e) =>
              setNewResource({ ...newResource, url: e.target.value })
            }
            disabled={loading}
          />
          <Button onClick={handleAdd} disabled={loading}>
            Add
          </Button>
        </HFlex>
      </VFlex>
      <VFlex className="gap-4">
        {resources.map((res) => {
          const isEditing = editingId === res.id

          return (
            <Card key={res.id} className="p-4">
              <HFlex className="items-center justify-between gap-2">
                {isEditing ? (
                  <HFlex className="w-full gap-2">
                    <Input
                      className="w-1/2"
                      value={editResource.name}
                      onChange={(e) =>
                        setEditResource({
                          ...editResource,
                          name: e.target.value,
                        })
                      }
                      placeholder="Name"
                      disabled={loading}
                    />
                    <Input
                      className="w-1/2"
                      value={editResource.url}
                      onChange={(e) =>
                        setEditResource({
                          ...editResource,
                          url: e.target.value,
                        })
                      }
                      placeholder="URL"
                      disabled={loading}
                    />
                  </HFlex>
                ) : (
                  <VFlex className="gap-1">
                    <P1>{res.name}</P1>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {res.url}
                    </a>
                  </VFlex>
                )}
                <HFlex className="gap-2">
                  <HFlex className="gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={
                        isEditing
                          ? () => setEditingId(null)
                          : () => handleEdit(res.id)
                      }
                      disabled={loading}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant={isEditing ? 'default' : 'destructive'}
                      onClick={
                        isEditing
                          ? () => handleEditSave(res.id)
                          : () => handleDelete(res.id)
                      }
                      disabled={loading}
                    >
                      {isEditing ? 'Save' : 'Delete'}
                    </Button>
                  </HFlex>
                </HFlex>
              </HFlex>
            </Card>
          )
        })}
      </VFlex>
    </VFlex>
  )
}
