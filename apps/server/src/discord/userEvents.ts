import { Client, PartialUser } from 'discord.js'
import { captureDiscordError, upsertDiscordUser } from '.'
import { User } from 'discord.js'

export function setupUserEvents(discordClient: Client) {
  discordClient.on(
    'userUpdate',
    async (oldUser: User | PartialUser, newUser: User) => {
      try {
        // DEBT: check community/guild exists first?
        await upsertDiscordUser(newUser)
      } catch (error) {
        await captureDiscordError('userUpdate', error, {
          oldUser,
          newUser,
        })
      }
    }
  )
}
