import OAuth2Client from './utils/oauth';
import { Request } from 'itty-router';
import { Routes } from 'discord-api-types/v9';

const DISCORD_CLIENT = new OAuth2Client({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  scopes: ['identify'],
  endpoints: {
    auth: 'https://discordapp.com/api/oauth2/authorize',
    token: 'https://discordapp.com/api/oauth2/token',
  },
});

const DISCORD_BASE_URL = 'https://discord.com/api/v9/';

export async function beginDiscordOauth(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);
  return DISCORD_CLIENT.redirect(
    `${reqUrl.protocol}//${reqUrl.host}/oauth/discord/callback`,
  );
}

export async function handleDiscordCallback(req: Request): Promise<Response> {
  const code = req.query?.code;
  const state = req.query?.state;
  if (!code || !state) {
    return new Response('Missing query params', { status: 400 });
  }

  const reqUrl = new URL(req.url);

  const token = await DISCORD_CLIENT.getToken(
    code,
    `${reqUrl.protocol}//${reqUrl.host}/oauth/discord/callback`,
  );

  const userData = await fetch(DISCORD_BASE_URL + Routes.user(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Portcullis/1.0.0 (https://github.com/nint8835/portcullis)',
    },
  });

  return new Response(JSON.stringify(await userData.json()), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
