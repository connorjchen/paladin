import { useEffect, useState } from 'react'
import { VFlex } from '@/components/custom/VFlex'
import { usePostTagStore } from '@/stores/postTag'
import { DetailedPostTag } from '@paladin/shared'
import { H2, H3 } from '@/components/custom/Text'
import { TagForm } from './TagForm'
import { TagCard } from './TagCard'
import { DeleteTagDialog } from './DeleteTagDialog'

const defaultTag = { name: '', color: '#000000' }

export function ManagePostTags() {
  const { getPostTags, createPostTag, updatePostTag, deletePostTag } =
    usePostTagStore()
  const [tags, setTags] = useState<DetailedPostTag[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTag, setNewTag] = useState(defaultTag)
  const [editTag, setEditTag] = useState(defaultTag)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<DetailedPostTag | null>(null)

  const populateTags = async () => {
    const response = await getPostTags()
    if (response.data) {
      setTags(response.data.postTags)
    }
  }

  useEffect(() => {
    populateTags()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newTag.name.trim()) return
    setLoading(true)
    await createPostTag(newTag)
    await populateTags()
    setNewTag(defaultTag)
    setLoading(false)
  }

  const handleDeleteClick = (tag: DetailedPostTag) => {
    if (tag._count?.posts && tag._count.posts > 0) {
      setTagToDelete(tag)
      setDeleteDialogOpen(true)
    } else {
      handleDelete(tag.id)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    await deletePostTag(id)
    await populateTags()
    setLoading(false)
    setDeleteDialogOpen(false)
    setTagToDelete(null)
  }

  const handleEdit = (id: string) => {
    const tag = tags.find((t) => t.id === id)
    if (tag) {
      setEditingId(id)
      setEditTag({ name: tag.name, color: tag.color })
    }
  }

  const handleEditSave = async (id: string) => {
    setLoading(true)
    await updatePostTag(id, { name: editTag.name, color: editTag.color })
    await populateTags()
    setEditingId(null)
    setLoading(false)
  }

  if (!tags) return <div>No tags found</div>

  return (
    <VFlex className="gap-4">
      <H3>Post Tags</H3>

      <TagForm
        newTag={newTag}
        onNewTagChange={setNewTag}
        onSubmit={handleAdd}
        loading={loading}
      />

      <VFlex className="gap-4">
        {tags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            editingId={editingId}
            editTag={editTag}
            onEditTagChange={setEditTag}
            onEdit={handleEdit}
            onEditSave={handleEditSave}
            onEditCancel={() => setEditingId(null)}
            onDelete={handleDeleteClick}
            loading={loading}
          />
        ))}
      </VFlex>

      <DeleteTagDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tagToDelete={tagToDelete}
        onDelete={() => tagToDelete && handleDelete(tagToDelete.id)}
        loading={loading}
      />
    </VFlex>
  )
}
