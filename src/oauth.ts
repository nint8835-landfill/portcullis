import OAuth2Client from './utils/oauth';

const DISCORD_CLIENT = new OAuth2Client({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  scopes: ['identify'],
  endpoints: {
    auth: 'https://discordapp.com/api/oauth2/authorize',
    token: 'https://discordapp.com/api/oauth2/token',
  },
});

export async function beginDiscordOauth(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);
  return DISCORD_CLIENT.redirect(
    `${reqUrl.protocol}//${reqUrl.host}/oauth/discord/callback`,
  );
}
