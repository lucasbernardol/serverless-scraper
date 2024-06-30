import { Hono } from 'hono';

import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import type { HonoOptions } from 'hono/hono-base';

import { zValidator, Hook } from '@hono/zod-validator';
import { z } from 'zod';

import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import scraper from 'metadata-scraper';

const options: HonoOptions<{}> = {
	strict: false,
};

const zodValidationHook: Hook<{}, any, any> = (exception, ctx) => {
	if (!exception.success) {
		throw new HTTPException(StatusCodes.BAD_REQUEST, {
			message: `${exception.error.errors[0].message}`,
			cause: exception,
		});
	}
};

export const app = new Hono(options);

app.use(cors());
app.use(secureHeaders());

app.use(logger());

app.get(
	'/',
	zValidator(
		'query',
		z.object({ url: z.string().trim().url().max(2048) }),
		zodValidationHook,
	),
	async (ctx) => {
		try {
			const { url } = ctx.req.valid('query');

			const { title, description, keywords, icon, image, language } =
				await scraper(url);

			return ctx.json(
				{
					title,
					language,
					keywords,
					description,
					icon,
					image,
				},
				StatusCodes.OK,
			);
		} catch (error: any) {
			if (error.name === 'RequestError') {
				// Got error (invalid host)
				throw new HTTPException(StatusCodes.BAD_REQUEST, {
					message: 'Invalid host',
				});
			}

			throw error;
		}
	},
);

app.notFound(async (ctx) => {
	throw new HTTPException(StatusCodes.NOT_FOUND);
});

app.onError(async (error, ctx) => {
	console.log(error);
	if (error instanceof HTTPException) {
		return ctx.json(
			{
				error: {
					name: 'HttpException',
					message: error.message || getReasonPhrase(error.status),
					status: error.status,
				},
			},
			error.status,
		);
	}

	return ctx.json(
		{
			error: {
				name: 'HttpException',
				message: 'Internal Server Error',
				status: StatusCodes.INTERNAL_SERVER_ERROR,
			},
		},
		StatusCodes.INTERNAL_SERVER_ERROR,
	);
});
