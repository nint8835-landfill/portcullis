import { Router } from 'itty-router';
import {
  beginDiscordOauth,
  beginGithubOauth,
  handleDiscordCallback,
  handleGithubCallback,
} from './oauth';

const router = Router();

router.get('/oauth/discord/auth', beginDiscordOauth);
router.get('/oauth/discord/callback', handleDiscordCallback);
router.get('/oauth/github/auth', beginGithubOauth);
router.get('/oauth/github/callback', handleGithubCallback);

router.all('*', () => new Response('Not found.', { status: 404 }));

export default router;
