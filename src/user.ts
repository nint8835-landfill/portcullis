import { getUser } from './utils/auth';

export async function getCurrentUser(req: Request): Promise<Response> {
  const currentUser = await getUser(req);
  let userRep = null;

  if (currentUser) {
    const { identities, sessionKey, ...cleanedUser } = currentUser;
    userRep = cleanedUser;
  }

  return new Response(JSON.stringify(userRep), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
