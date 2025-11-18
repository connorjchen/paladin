import { UserRole } from '@prisma/client'
import { DetailedComment, DetailedPost } from './types'

export function isAdmin(userRole: UserRole | undefined) {
  return userRole === UserRole.ADMIN
}

export function isAuthor(
  authorId: string | undefined,
  userId: string | undefined
) {
  if (!authorId || !userId) return false
  return authorId === userId
}

export function simpleHash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16)
}

export const DISCORD_BOT_USER_ID = 'cmctmsef12001vjlsx8xrlf1n'

export function getDiscordAvatarIfExists(
  obj: DetailedPost | DetailedComment
): string {
  const authorObj =
    'discordThread' in obj
      ? obj.discordThread?.author
      : obj.discordMessage?.author

  // If the author is not the Discord Bot, use the author's image
  if (obj.authorId !== DISCORD_BOT_USER_ID) {
    return obj.author.image
  }

  if (authorObj && 'avatar' in authorObj) {
    return authorObj.avatar
  }
  return obj.author.image
}

export const getDiscordUsernameIfExists = (
  obj: DetailedComment | DetailedPost
) => {
  const authorObj =
    'discordThread' in obj
      ? obj.discordThread?.author
      : obj.discordMessage?.author

  // If the author is not the Discord Bot, use the author's username
  if (obj.authorId !== DISCORD_BOT_USER_ID) {
    return obj.author.username
  }

  if (authorObj && 'username' in authorObj) {
    return authorObj.username
  }
  return obj.author.username
}
