import { Router } from 'itty-router';
import { beginDiscordOauth, handleDiscordCallback } from './oauth';

const router = Router();

router.get('/oauth/discord/auth', beginDiscordOauth);
router.get('/oauth/discord/callback', handleDiscordCallback);

router.all('*', () => new Response('Not found.', { status: 404 }));

export default router;
