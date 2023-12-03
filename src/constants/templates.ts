import createTemplate from '../lib/createTemplate'
import { DiscordArgs, GitHubArgs, GoogleArgs, TwitchArgs, VkontakteArgs } from '../types'

//TODO: add more templates

export default {
  google: createTemplate<GoogleArgs>('https://accounts.google.com/o/oauth2/v2/auth'),
  discord: createTemplate<DiscordArgs>('https://discord.com/oauth2/authorize'),
  vkontakte: createTemplate<VkontakteArgs>('https://oauth.vk.com/authorize'),
  twitch: createTemplate<TwitchArgs>('https://id.twitch.tv/oauth2/authorize'),
  github: createTemplate<GitHubArgs>('https://github.com/login/oauth/authorize')
}
