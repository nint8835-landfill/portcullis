import { Router } from 'itty-router';
import { beginDiscordOauth } from './oauth';

const router = Router();

router.get('/oauth/discord/auth', beginDiscordOauth);

router.all('*', () => new Response('Not found.', { status: 404 }));

export default router;
