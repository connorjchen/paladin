import React from 'react'
import { DetailedPost } from '@paladin/shared'
import { HFlex } from './HFlex'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useIsMobile } from '@/hooks/use-mobile'

interface PostContentProps {
  post: DetailedPost
  buttonSection: React.ReactNode
}

export function PostContent({ post, buttonSection }: PostContentProps) {
  const isMobile = useIsMobile()

  return (
    <>
      <MarkdownRenderer content={post.content} />
      <HFlex className="justify-end">{isMobile && buttonSection}</HFlex>
    </>
  )
}
