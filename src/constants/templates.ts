import createTemplate from '../lib/createTemplate';
import {
   DiscordArgs,
   GitHubArgs,
   GoogleArgs,
   MicrosoftArgs,
   PopupViewParams,
   TemplateArgs,
   TwitchArgs,
   VkontakteArgs
} from '../types';

export default {
   google: createTemplate<GoogleArgs>('https://accounts.google.com/o/oauth2/v2/auth'),
   discord: createTemplate<DiscordArgs>('https://discord.com/oauth2/authorize'),
   vkontakte: createTemplate<VkontakteArgs>('https://oauth.vk.com/authorize'),
   twitch: createTemplate<TwitchArgs>('https://id.twitch.tv/oauth2/authorize'),
   github: createTemplate<GitHubArgs>('https://github.com/login/oauth/authorize'),
   linkedIn: createTemplate('https://www.linkedin.com/oauth/v2/authorization'),
   microsoft: (
      { tenant, ...params }: TemplateArgs<MicrosoftArgs>,
      popup?: PopupViewParams
   ) =>
      createTemplate<Omit<MicrosoftArgs, 'tenant'>>(
         `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
      )(params, popup)
};
