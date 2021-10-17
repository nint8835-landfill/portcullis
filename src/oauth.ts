import { Octokit } from '@octokit/rest';
import { Routes, APIUser } from 'discord-api-types/v9';
import { Request } from 'itty-router';
import { IdentityProvider, User } from './data/users';
import { getRedirectUri, OAuth2Client } from './utils/oauth';

const DISCORD_CLIENT = new OAuth2Client({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  scopes: ['identify'],
  endpoints: {
    auth: 'https://discordapp.com/api/oauth2/authorize',
    token: 'https://discordapp.com/api/oauth2/token',
  },
});

const GITHUB_CLIENT = new OAuth2Client({
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  scopes: ['read:user'],
  endpoints: {
    auth: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
  },
});

const DISCORD_BASE_URL = 'https://discord.com/api/v9/';

export async function beginDiscordOauth(req: Request): Promise<Response> {
  return DISCORD_CLIENT.redirect(getRedirectUri(req, 'discord'));
}

export async function handleDiscordCallback(req: Request): Promise<Response> {
  const code = req.query?.code;
  const state = req.query?.state;
  if (!code || !state) {
    return new Response('Missing query params', { status: 400 });
  }

  const token = await DISCORD_CLIENT.getToken(
    code,
    getRedirectUri(req, 'discord'),
  );

  const userData = await fetch(DISCORD_BASE_URL + Routes.user(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Portcullis/1.0.0 (https://github.com/nint8835/portcullis)',
    },
  });

  const userDataJson: APIUser = await userData.json();

  let userInstance = await User.get(userDataJson.id);
  if (userInstance === null) {
    userInstance = new User({
      id: userDataJson.id,
      isOnboarding: true,
      isManaging: false,
      isJoining: false,
      identities: [],
    });
  }
  const identityData = userInstance.getIdentityData(
    IdentityProvider.Discord,
    userDataJson.id,
  );
  if (identityData) {
    identityData.verifiedAt = new Date();
    identityData.data = userDataJson;
  } else {
    userInstance.identities.push({
      provider: IdentityProvider.Discord,
      id: userDataJson.id,
      verifiedAt: new Date(),
      data: userDataJson,
    });
  }

  await userInstance.save(userInstance.id);

  return new Response(JSON.stringify(userDataJson), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

export async function beginGithubOauth(req: Request): Promise<Response> {
  return GITHUB_CLIENT.redirect(getRedirectUri(req, 'github'));
}

export async function handleGithubCallback(req: Request): Promise<Response> {
  const code = req.query?.code;
  const state = req.query?.state;
  if (!code || !state) {
    return new Response('Missing query params', { status: 400 });
  }

  const token = await GITHUB_CLIENT.getToken(
    code,
    getRedirectUri(req, 'github'),
  );

  const octokit = new Octokit({
    auth: token,
    userAgent: 'Portcullis/1.0.0 (https://github.com/nint8835/portcullis)',
  });

  const user = await octokit.users.getAuthenticated();

  return new Response(JSON.stringify(user.data), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
