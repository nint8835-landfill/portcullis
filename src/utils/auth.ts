import { Request as IttyRequest } from 'itty-router';
import cookie from 'worktop/cookie';
import { User } from '../data/users';
import { decryptData } from './crypto';

type ClientOptions = {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  endpoints: {
    auth: string;
    token: string;
  };
};

export function getRedirectUri(req: IttyRequest, provider: string): string {
  const reqUrl = new URL(req.url);
  return `${reqUrl.protocol}//${reqUrl.host}/oauth/${provider}/callback`;
}

export class OAuth2Client {
  options: ClientOptions;

  constructor(options: ClientOptions) {
    this.options = options;
  }

  redirect(redirectUri: string, state: string = 'state'): Response {
    const url = new URL(this.options.endpoints.auth);

    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', this.options.clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('scope', this.options.scopes.join(' '));
    url.searchParams.append('state', state);

    return Response.redirect(url.href, 307);
  }

  async getToken(
    code: string,
    redirectUri: string | null = null,
  ): Promise<string> {
    const tokenData = new FormData();

    tokenData.append('grant_type', 'authorization_code');
    tokenData.append('code', code);
    tokenData.append('client_id', this.options.clientId);
    tokenData.append('client_secret', this.options.clientSecret);
    if (redirectUri !== null) {
      tokenData.append('redirect_uri', redirectUri);
    }

    const resp = await fetch(this.options.endpoints.token, {
      method: 'POST',
      body: tokenData,
      headers: {
        'User-Agent':
          'Portcullis/1.0.0 (https://github.com/nint8835/portcullis)',
        Accept: 'application/json',
      },
    });

    return (await resp.json()).access_token;
  }
}

/**
 * Get the current user from the request.
 */
export async function getUser(req: IttyRequest): Promise<User | null> {
  const cfReq = req as Request;
  const cookieHeader = cfReq.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookie.parse(cookieHeader);
  if (cookies['session'] === null) {
    return null;
  }
  const session = JSON.parse(
    await decryptData(cookies['session'], SESSION_SECRET),
  );
  const user = await User.get(session.userId);
  if (user === null || user.sessionKey !== session.sessionKey) {
    return null;
  }
  return user;
}
