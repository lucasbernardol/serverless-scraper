import { Hono } from 'hono';

import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { logger } from 'hono/logger';
import type { HonoOptions } from 'hono/hono-base';

const options: HonoOptions<{}> = {
	strict: false,
};

export const app = new Hono(options);

app.use(cors());
app.use(secureHeaders());

app.use(logger());

app.get('/', async (ctx) => {
	return ctx.json({ ok: true });
});
