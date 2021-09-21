type ClientOptions = {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  endpoints: {
    auth: string;
    token: string;
  };
};

export default class OAuth2Client {
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
}
