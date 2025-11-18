import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Quote as QuoteIcon,
  Heading3,
  Upload,
  CheckSquare,
  Eye,
  Edit,
} from 'lucide-react'
import { Input } from '../ui/input'
import { HFlex } from './HFlex'
import { VFlex } from './VFlex'
import { cn, getR2Url, uploadImageToBlob } from '@/lib/utils'
import { emitToast } from '@/hooks/use-toast'
import { nanoid } from 'nanoid'
import { useBlobStore } from '@/stores/blob'
import { P1 } from './Text'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MarkdownEditorProps {
  value: string
  onChange: (markdownValue: string) => void
  placeholder?: string
  className?: string
  onCmdEnter?: () => void
}

interface TextManipulationResult {
  newValue: string
  newCursorStart: number
  newCursorEnd: number
}

function insertAtLineStart(
  value: string,
  cursorStart: number,
  prefix: string
): TextManipulationResult {
  // Find the start of the current line
  const lineStart = value.lastIndexOf('\n', cursorStart - 1) + 1
  const lineEnd = value.indexOf('\n', cursorStart)
  const actualLineEnd = lineEnd === -1 ? value.length : lineEnd

  // Get the current line content
  const currentLine = value.substring(lineStart, actualLineEnd)

  // Check if the line already has this prefix
  if (currentLine.startsWith(prefix)) {
    // Remove the prefix
    const newLine = currentLine.substring(prefix.length)
    const newValue =
      value.substring(0, lineStart) + newLine + value.substring(actualLineEnd)
    return {
      newValue,
      newCursorStart: cursorStart - prefix.length,
      newCursorEnd: cursorStart - prefix.length,
    }
  } else {
    // Add the prefix
    const newValue =
      value.substring(0, lineStart) + prefix + value.substring(lineStart)
    return {
      newValue,
      newCursorStart: cursorStart + prefix.length,
      newCursorEnd: cursorStart + prefix.length,
    }
  }
}

function wrapText(
  value: string,
  cursorStart: number,
  cursorEnd: number,
  prefix: string,
  suffix: string
): TextManipulationResult {
  const selectedText = value.substring(cursorStart, cursorEnd)

  if (selectedText) {
    // Wrap selected text
    const newValue =
      value.substring(0, cursorStart) +
      prefix +
      selectedText +
      suffix +
      value.substring(cursorEnd)
    return {
      newValue,
      newCursorStart: cursorStart + prefix.length,
      newCursorEnd: cursorStart + prefix.length + selectedText.length,
    }
  } else {
    // Insert markers and position cursor between them
    const newValue =
      value.substring(0, cursorStart) +
      prefix +
      suffix +
      value.substring(cursorStart)
    return {
      newValue,
      newCursorStart: cursorStart + prefix.length,
      newCursorEnd: cursorStart + prefix.length,
    }
  }
}

function insertText(
  value: string,
  cursorStart: number,
  text: string
): TextManipulationResult {
  const newValue =
    value.substring(0, cursorStart) + text + value.substring(cursorStart)
  return {
    newValue,
    newCursorStart: cursorStart + text.length,
    newCursorEnd: cursorStart + text.length,
  }
}

interface LinkInputDialogProps {
  onInsert: (url: string, text?: string) => void
  onCancel: () => void
}

function LinkInputDialog({ onInsert, onCancel }: LinkInputDialogProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    urlInputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (url.trim()) {
      onInsert(url.trim(), text.trim() || undefined)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <VFlex className="gap-2 bg-gray-50 p-2 dark:bg-gray-800">
      <Input
        ref={urlInputRef}
        placeholder="Enter URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Input
        placeholder="Link text (optional)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <HFlex className="gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!url.trim()}>
          Add Link
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </HFlex>
    </VFlex>
  )
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  onCmdEnter,
}: MarkdownEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const { uploadToBlob } = useBlobStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onCmdEnter?.()
      }

      // Add keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            handleBold()
            break
          case 'i':
            e.preventDefault()
            handleItalic()
            break
          case 'k':
            e.preventDefault()
            openLinkDialog()
            break
        }
      }
    }

    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown)
      return () => textarea.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCmdEnter])

  const applyTextChange = (result: TextManipulationResult) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current

    // Focus and set selection first
    textarea.focus()
    textarea.setSelectionRange(0, textarea.value.length)

    // Use execCommand for proper undo support
    const success = document.execCommand('insertText', false, result.newValue)

    if (!success) {
      // Fallback to onChange if execCommand fails
      onChange(result.newValue)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            result.newCursorStart,
            result.newCursorEnd
          )
          textareaRef.current.focus()
        }
      }, 0)
    } else {
      // Set cursor position after execCommand
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            result.newCursorStart,
            result.newCursorEnd
          )
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleBold = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = wrapText(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        '**',
        '**'
      )
      applyTextChange(result)
    }
  }

  const handleItalic = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = wrapText(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        '*',
        '*'
      )
      applyTextChange(result)
    }
  }

  const handleCode = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = wrapText(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        '`',
        '`'
      )
      applyTextChange(result)
    }
  }

  const handleHeading = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = insertAtLineStart(value, textarea.selectionStart, '### ')
      applyTextChange(result)
    }
  }

  const handleQuote = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = insertAtLineStart(value, textarea.selectionStart, '> ')
      applyTextChange(result)
    }
  }

  const handleBulletList = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = insertAtLineStart(value, textarea.selectionStart, '- ')
      applyTextChange(result)
    }
  }

  const handleNumberedList = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = insertAtLineStart(value, textarea.selectionStart, '1. ')
      applyTextChange(result)
    }
  }

  const handleTodo = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const result = insertAtLineStart(value, textarea.selectionStart, '- [ ] ')
      applyTextChange(result)
    }
  }

  const insertLink = (url: string, text?: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    // Ensure URL is absolute
    let absoluteUrl = url.trim()
    if (
      !absoluteUrl.startsWith('http://') &&
      !absoluteUrl.startsWith('https://')
    ) {
      absoluteUrl = `https://${absoluteUrl}`
    }

    // Use provided text, selected text, or URL as display text
    const displayText = text?.trim() || selectedText || absoluteUrl
    const markdownLink = `[${displayText}](${absoluteUrl})`

    // Replace selected text or insert at cursor
    const result = insertText(value, start, markdownLink)
    applyTextChange(result)
  }

  const openLinkDialog = () => {
    setShowLinkInput(true)
  }

  const performImageUpload = async (file: File) => {
    const key = `markdown-editor/${nanoid()}-${file.name}`
    return uploadImageToBlob(file, key, uploadToBlob)
  }

  const processImageFile = async (file: File) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const uploadResult = await performImageUpload(file)

    if (uploadResult) {
      const imageUrl = getR2Url(uploadResult.r2Key)

      // Ensure images are on their own lines for proper rendering
      const start = textarea.selectionStart
      const value = textarea.value
      const beforeCursor = value.substring(0, start)
      const afterCursor = value.substring(start)

      // Add newlines before and after the image if needed
      const needsNewlineBefore =
        beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      const needsNewlineAfter =
        afterCursor.length > 0 && !afterCursor.startsWith('\n')

      const markdownImage =
        (needsNewlineBefore ? '\n' : '') +
        `![Image](${imageUrl})` +
        (needsNewlineAfter ? '\n' : '')

      const result = insertText(value, textarea.selectionStart, markdownImage)
      applyTextChange(result)
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImageFile(file)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set drag over to false if we're leaving the editor area entirely
    if (!editorRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    const nonImageFiles = files.filter(
      (file) => !file.type.startsWith('image/')
    )

    if (imageFiles.length > 0) {
      await processImageFile(imageFiles[0])
    }

    if (nonImageFiles.length > 0) {
      emitToast({
        title: 'Invalid file type',
        description: 'Only image files are supported for drag and drop.',
      })
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text')

    // Check if pasted text looks like a URL
    const urlRegex = /^https?:\/\/.+/i
    if (urlRegex.test(pastedText.trim())) {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      // If there's selected text, convert it to a link
      if (selectedText && selectedText !== pastedText) {
        e.preventDefault()
        const markdownLink = `[${selectedText}](${pastedText.trim()})`

        // Replace the selected text with the markdown link
        const newValue =
          value.substring(0, start) + markdownLink + value.substring(end)
        const result: TextManipulationResult = {
          newValue,
          newCursorStart: start + markdownLink.length,
          newCursorEnd: start + markdownLink.length,
        }
        applyTextChange(result)
        return
      }
    }

    // Let the default paste behavior happen for non-URLs or no selection
  }

  return (
    <VFlex className={cn('border-sidebar-border rounded-lg border', className)}>
      <HFlex className="flex-wrap gap-1 rounded-t-lg bg-gray-50 p-2 dark:bg-gray-800">
        {/* Preview Toggle */}
        <Button
          variant={isPreviewMode ? 'default' : 'ghost'}
          size="sm"
          tabIndex={-1}
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          title={isPreviewMode ? 'Edit' : 'Preview'}
        >
          {isPreviewMode ? (
            <Edit className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        {/* Formatting buttons - only show in edit mode */}
        {!isPreviewMode && (
          <>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleHeading}
              title="Heading (###)"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleBold}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleItalic}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleQuote}
              title="Quote"
            >
              <QuoteIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleCode}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={openLinkDialog}
              title="Link (Ctrl+K)"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleBulletList}
              title="Bullet List"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleNumberedList}
              title="Numbered List"
            >
              <ListOrderedIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={handleTodo}
              title="Todo Checkbox"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              tabIndex={-1}
              onClick={triggerImageUpload}
              title="Upload Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </HFlex>

      {!isPreviewMode && showLinkInput && (
        <LinkInputDialog
          onInsert={(url, text) => {
            insertLink(url, text)
            setShowLinkInput(false)
          }}
          onCancel={() => setShowLinkInput(false)}
        />
      )}

      <div
        ref={editorRef}
        className="relative"
        onDragOver={!isPreviewMode ? handleDragOver : undefined}
        onDragLeave={!isPreviewMode ? handleDragLeave : undefined}
        onDrop={!isPreviewMode ? handleDrop : undefined}
      >
        {isPreviewMode ? (
          <div className="min-h-[200px] w-full p-3">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="text-muted-foreground italic">
                {placeholder || 'Nothing to preview...'}
              </div>
            )}
          </div>
        ) : (
          <textarea
            key="markdown-textarea"
            ref={textareaRef}
            value={value || ''}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="bg-background text-foreground min-h-[200px] w-full resize-y border-0 p-3 text-sm outline-none focus:ring-0"
          />
        )}

        {!isPreviewMode && isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/90 dark:bg-blue-900/90">
            <div className="text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-blue-500" />
              <P1 className="text-blue-600">Drop image here to upload</P1>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </VFlex>
  )
}
