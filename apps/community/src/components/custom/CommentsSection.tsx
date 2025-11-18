import React from 'react'
import {
  DetailedPost,
  DetailedComment,
  isAdmin,
  DetailedUser,
} from '@paladin/shared'
import { PostType } from '@prisma/client'
import { VFlex } from './VFlex'
import { CommentCard } from './CommentCard'
import { H3 } from './Text'

// Limit how deep threaded comments render visually
const MAX_THREAD_DEPTH = 2

interface CommentWithChildren extends DetailedComment {
  children: CommentWithChildren[]
}

function organizeComments(
  comments: DetailedPost['comments']
): CommentWithChildren[] {
  const commentMap = new Map<string, CommentWithChildren>()
  const rootComments: CommentWithChildren[] = []

  // First pass: Create CommentWithChildren objects and store in map
  comments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      children: [],
    })
  })

  // Second pass: Organize into tree structure
  comments.forEach((comment) => {
    const threadedComment = commentMap.get(comment.id)
    if (!threadedComment) {
      console.error('Comment not found', comment.id)
      return
    }

    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId)
      if (!parent) {
        console.error('Parent comment not found', comment.parentId)
        return
      }
      parent.children.push(threadedComment)
    } else {
      rootComments.push(threadedComment)
    }
  })

  return rootComments
}

interface CommentsSectionProps {
  post: DetailedPost
  currentUser: DetailedUser | null
  isPostAuthor: boolean
  replyingTo: { id: string; author: string } | null
  onReplyClick: (commentId: string, author: string) => void
  onAcceptAnswerClick: (commentId: string, isAcceptedAnswer: boolean) => void
  onCommentEditClick: (comment: DetailedComment) => void
  onCommentDeleteClick: (commentId: string) => void
}

export function CommentsSection({
  post,
  currentUser,
  isPostAuthor,
  replyingTo,
  onReplyClick,
  onAcceptAnswerClick,
  onCommentEditClick,
  onCommentDeleteClick,
}: CommentsSectionProps) {
  const threadedComments = organizeComments(post.comments)
  const renderThreadedComments = (
    comments: CommentWithChildren[],
    onReplyClickLocal: (commentId: string, author: string) => void,
    onAcceptAnswerClickLocal: (
      commentId: string,
      isAcceptedAnswer: boolean
    ) => void,
    replyingToId: string | null,
    showAcceptButton: boolean,
    depth = 0
  ): React.ReactNode[] => {
    return comments.map((comment) => {
      const visualDepth = Math.min(depth, MAX_THREAD_DEPTH)
      return (
        <VFlex key={comment.id}>
          <CommentCard
            post={post}
            comment={comment}
            onReplyClick={onReplyClickLocal}
            isReplying={replyingToId === comment.id}
            depth={visualDepth}
            showAcceptButton={showAcceptButton}
            onAcceptAnswerClick={onAcceptAnswerClickLocal}
            onEditClick={onCommentEditClick}
            onDeleteClick={onCommentDeleteClick}
          />
          {comment.children.length > 0 && (
            <VFlex>
              {renderThreadedComments(
                comment.children,
                onReplyClickLocal,
                onAcceptAnswerClickLocal,
                replyingToId,
                showAcceptButton,
                depth + 1
              )}
            </VFlex>
          )}
        </VFlex>
      )
    })
  }

  const showAcceptButton =
    (isAdmin(currentUser?.role) || isPostAuthor) &&
    post.type === PostType.QUESTION

  return (
    <VFlex>
      <H3>Comments</H3>
      {post.comments.length === 0 ? (
        <div className="text-muted-foreground">No comments yet.</div>
      ) : (
        renderThreadedComments(
          threadedComments,
          onReplyClick,
          onAcceptAnswerClick,
          replyingTo?.id ?? null,
          showAcceptButton,
          0
        )
      )}
    </VFlex>
  )
}
