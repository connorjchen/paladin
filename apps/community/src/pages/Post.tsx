import React from 'react'
import { Container } from '../components/custom/Container'
import { useParams } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { usePostStore } from '@/stores/post'
import { DetailedComment, DetailedPost, isAuthor } from '@paladin/shared'
import {
  PostType,
  UserRole,
  FeedbackStatus,
  QuestionStatus,
} from '@prisma/client'
import { Loading } from '@/components/custom/Loading'
import { useCommentStore } from '../stores/comment'
import { useUserStore } from '@/stores/user'
import { NoDataCard } from '@/components/custom/NoDataCard'
import SEO from '@/components/custom/SEO'
import { NewPostModal } from '../components/custom/NewPostModal'
import { CommentEditModal } from '../components/custom/CommentEditModal'
import { MarkdownRenderer } from '@/components/custom/MarkdownRenderer'
import { PostHeader } from '@/components/custom/PostHeader'
import { PostDeleteDialog } from '@/components/custom/PostDeleteDialog'
import { CommentsSection } from '@/components/custom/CommentsSection'
import { CommentInput } from '@/components/custom/CommentInput'
import { PostActions } from '@/components/custom/PostActions'
import { Card } from '@/components/ui/card'
import { useCommunityStore } from '@/stores/community'
import { DiscordMessageAttachments } from '@/components/custom/DiscordMessageAttachments'
import { VFlex } from '@/components/custom/VFlex'
import { useSubpathNavigate } from '@/hooks/use-subpath-navigate'

export function PostPage() {
  const { postId } = useParams()
  const navigate = useSubpathNavigate()
  const { community } = useCommunityStore()
  const {
    getPost,
    updateFeedbackStatus,
    updateQuestionStatus,
    updatePost,
    pinPost,
    deletePost,
  } = usePostStore()
  const { user: currentUser, isAuthed } = useUserStore()
  const [post, setPost] = useState<DetailedPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{
    id: string
    author: string
  } | null>(null)
  const { createComment, markAsAccepted, deleteComment } = useCommentStore()
  const isPostAuthor = isAuthor(post?.authorId, currentUser?.id)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCommentEditModal, setShowCommentEditModal] = useState(false)
  const [editingComment, setEditingComment] = useState<DetailedComment | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [userAuthorizedToSeePost, setUserAuthorizedToSeePost] = useState(false)

  const handleCommentChange = useCallback((markdownValue: string) => {
    setComment(markdownValue)
  }, [])

  const fetchPost = async () => {
    if (!postId) return
    try {
      setLoading(true)
      const result = await getPost(postId)
      if (result.data) {
        setPost(result.data.post)
        setUserAuthorizedToSeePost(result.data.userAuthorizedToSeePost)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [postId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCommentSubmit = async () => {
    if (!comment || !postId || commentSubmitting) return
    setCommentSubmitting(true)
    try {
      await createComment({
        postId,
        content: comment,
        parentId: replyingTo?.id,
      })
      fetchPost()
      setComment('')
      setReplyingTo(null)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleReplyClick = useCallback(
    (commentId: string, author: string) => {
      if (!isAuthed) {
        navigate('/login')
        return
      }

      if (replyingTo?.id === commentId) {
        setReplyingTo(null)
      } else {
        setReplyingTo({ id: commentId, author })
      }
    },
    [replyingTo]
  )

  const handleFeedbackStatusChange = async (newStatus: FeedbackStatus) => {
    if (!postId) return
    await updateFeedbackStatus(postId, {
      status: newStatus,
    })
    // DEBT: Refresh post data (not ideal, but it works for now)
    fetchPost()
  }

  const handleQuestionStatusChange = async (newStatus: QuestionStatus) => {
    if (!postId) return
    await updateQuestionStatus(postId, {
      status: newStatus,
    })
    // DEBT: Refresh post data (not ideal, but it works for now)
    fetchPost()
  }

  const handlePinChange = async (isPinned: boolean) => {
    if (!postId) return
    await pinPost(postId, {
      isPinned,
    })
    // DEBT: Refresh post data (not ideal, but it works for now)
    fetchPost()
  }

  const handleAcceptAnswerClick = useCallback(
    async (commentId: string, isAcceptedAnswer: boolean) => {
      if (!postId) return
      await markAsAccepted(commentId, { isAcceptedAnswer })
      fetchPost() // Refresh to get updated state
    },
    [postId]
  )

  const handleCommentEditClick = useCallback((comment: DetailedComment) => {
    setEditingComment(comment)
    setShowCommentEditModal(true)
  }, [])

  const handleCommentDeleteClick = useCallback(async (commentId: string) => {
    await deleteComment(commentId)
    fetchPost() // Refresh to get updated state
  }, [])

  // Author
  const canEdit = isAuthor(post?.authorId, currentUser?.id)

  // Author or admin
  const canDelete =
    !!currentUser &&
    !!post &&
    (currentUser.id === post.authorId || currentUser.role === UserRole.ADMIN)

  if (loading) return <Loading />
  if (!post && !userAuthorizedToSeePost)
    return (
      <NoDataCard
        title="Post is private"
        description={
          currentUser
            ? 'This post is private, but you are authorized to see it.'
            : 'This post is private, but you are not logged in.'
        }
        buttonText={currentUser ? 'Go back to home' : 'Login'}
        onClick={() =>
          currentUser
            ? navigate('/')
            : navigate('/login?redirect=/post/' + postId)
        }
        className="mt-4"
      />
    )
  if (!post)
    return (
      <NoDataCard
        title="Post not found"
        description="The post you are looking for does not exist."
        buttonText="Go back to home"
        onClick={() => navigate('/')}
        className="mt-4"
      />
    )
  if (!community) {
    throw new Error('Community type-safe check')
  }

  const handleConvertType = async (postType: PostType) => {
    await updatePost(post.id, {
      type: postType,
    })
    fetchPost()
  }

  const handleDeleteConfirm = async () => {
    if (!postId) return
    setDeleting(true)
    await deletePost(postId)
    setDeleting(false)
    setShowDeleteDialog(false)
    navigate('/')
  }

  return (
    <>
      <SEO
        title={`${post.title} - ${community.name}`}
        description={post.content}
      />
      <Container>
        {/* Post (header + body combined) */}
        <Card className="p-4">
          <VFlex className="gap-2">
            <PostHeader
              post={post}
              onFeedbackStatusChange={handleFeedbackStatusChange}
              onQuestionStatusChange={handleQuestionStatusChange}
            />
            <MarkdownRenderer content={post.content} />
            <DiscordMessageAttachments
              attachments={post.discordThread?.starterMessageAttachments || []}
            />
            <div className="flex justify-end">
              <PostActions
                post={post}
                currentUser={currentUser}
                canEdit={canEdit}
                canDelete={canDelete}
                onPinChange={handlePinChange}
                onEditClick={() => setShowEditModal(true)}
                onDeleteClick={() => setShowDeleteDialog(true)}
                onConvertType={handleConvertType}
              />
            </div>
          </VFlex>
        </Card>

        {/* Modals and Dialogs */}
        <NewPostModal
          open={showEditModal}
          setOpen={setShowEditModal}
          post={post}
          onPostUpdated={fetchPost}
        />
        <CommentEditModal
          open={showCommentEditModal}
          setOpen={setShowCommentEditModal}
          comment={editingComment}
          onCommentUpdated={fetchPost}
        />
        <PostDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          deleting={deleting}
          onConfirmDelete={handleDeleteConfirm}
        />

        {/* Comments */}
        <CommentsSection
          post={post}
          currentUser={currentUser}
          isPostAuthor={isPostAuthor}
          replyingTo={replyingTo}
          onReplyClick={handleReplyClick}
          onAcceptAnswerClick={handleAcceptAnswerClick}
          onCommentEditClick={handleCommentEditClick}
          onCommentDeleteClick={handleCommentDeleteClick}
        />

        {/* Comment Input */}
        {community.isWebpageSubmissionsEnabled && (
          <CommentInput
            comment={comment}
            replyingTo={replyingTo}
            commentSubmitting={commentSubmitting}
            onCommentChange={handleCommentChange}
            onCommentSubmit={handleCommentSubmit}
            onCancelReply={() => setReplyingTo(null)}
          />
        )}
      </Container>
    </>
  )
}
