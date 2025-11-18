import React from 'react' // trust, we need it
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { marked } from 'marked'

interface CommentNotificationEmailProps {
  postTitle: string
  authorName: string
  commentText: string
  postUrl: string
  manageEmailPreferencesUrl: string
}

export const CommentNotificationEmail = ({
  postTitle,
  authorName,
  commentText,
  postUrl,
  manageEmailPreferencesUrl,
}: CommentNotificationEmailProps) => {
  const previewText = `See what ${authorName} wrote.`

  // Convert markdown to HTML
  const commentHtml = marked(commentText)

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>{previewText}</Preview>
        <Container style={container}>
          <Section style={{ paddingBottom: '20px' }}>
            <Text style={heading}>{postTitle}</Text>
            <Text style={paragraph}>Here's what {authorName} wrote:</Text>
            <div
              style={review}
              dangerouslySetInnerHTML={{ __html: commentHtml }}
            />
            <Button style={button} href={postUrl}>
              See Post
            </Button>
          </Section>
          <Link href={manageEmailPreferencesUrl} style={unsubscribeLink}>
            Manage email preferences
          </Link>
        </Container>
      </Body>
    </Html>
  )
}

CommentNotificationEmail.PreviewProps = {
  postTitle: 'How do I use this?',
  authorName: 'Alex',
  commentText: `This is a **bold comment** with some *italic text* and a [link](https://example.com).

Here's a code block:
\`\`\`javascript
console.log('Hello world!');
\`\`\`

And a list:
- Item 1
- Item 2
- Item 3`,
  postUrl: 'https://www.airbnb.com',
  manageEmailPreferencesUrl: 'https://www.airbnb.com',
} as CommentNotificationEmailProps

export default CommentNotificationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
}

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
}

const paragraph = {
  fontSize: '18px',
  lineHeight: '1.4',
  color: '#484848',
}

const review = {
  ...paragraph,
  padding: '24px',
  backgroundColor: '#f2f3f3',
  borderRadius: '0.5rem', // rounded-lg in Tailwind
  marginBottom: '16px',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '0.5rem', // rounded-lg in Tailwind
  color: '#fff',
  fontSize: '18px',
  padding: '19px 30px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
}

const unsubscribeLink = {
  fontSize: '14px',
  color: '#9ca299',
  textDecoration: 'underline',
}
