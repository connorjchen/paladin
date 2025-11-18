import { Client } from 'discord.js'
import { setupClientEvents } from './clientEvents'
import { setupErrorEvents } from './errorEvents'
import { setupInteractionEvents } from './interactionEvents'
import { setupUserEvents } from './userEvents'
import { setupGuildEvents } from './guildEvents'
import { setupChannelEvents } from './channelEvents'
import { setupThreadEvents } from './threadEvents'
import { setupMessageEvents } from './messageEvents'

export function setupDiscordEvents(discordClient: Client) {
  setupClientEvents(discordClient)
  setupErrorEvents(discordClient)
  setupInteractionEvents(discordClient)
  setupUserEvents(discordClient)
  setupGuildEvents(discordClient)
  setupChannelEvents(discordClient)
  setupThreadEvents(discordClient)
  setupMessageEvents(discordClient)
}

// Re-export all utility functions for backward compatibility
export * from './utils'
export * from './commands'
