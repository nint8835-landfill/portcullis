import { Request } from 'itty-router';

type ClientOptions = {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  endpoints: {
    auth: string;
    token: string;
  };
};

export function getRedirectUri(req: Request, provider: string): string {
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
      },
    });

    return (await resp.json()).access_token;
  }
}
