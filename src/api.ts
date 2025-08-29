import express from 'express';
import cors from 'cors';
import { logs, appConfig, log } from './state.js';
import type { Client } from 'discord.js';

export function startApiServer(ctx: { client: Client }, port = Number(process.env.API_PORT || 3000)) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get('/api/logs', (_req, res) => {
		res.json(logs.toArray());
	});

	app.get('/api/config', (_req, res) => {
		res.json(appConfig);
	});

	app.put('/api/config', (req, res) => {
		const body = req.body || {};
		if (typeof body.cards?.enabled === 'boolean') appConfig.cards.enabled = body.cards.enabled;
		if (typeof body.cards?.channelId !== 'undefined') appConfig.cards.channelId = body.cards.channelId || undefined;
		if (Array.isArray(body.cards?.channels)) appConfig.cards.channels = body.cards.channels.filter((x: unknown) => typeof x === 'string');
		if (typeof body.twitch?.enabled === 'boolean') appConfig.twitch.enabled = body.twitch.enabled;
		if (typeof body.twitch?.channelId !== 'undefined') appConfig.twitch.channelId = body.twitch.channelId || undefined;
		if (Array.isArray(body.twitch?.channels)) appConfig.twitch.channels = body.twitch.channels.filter((x: unknown) => typeof x === 'string');
		if (typeof body.stock?.enabled === 'boolean') appConfig.stock.enabled = body.stock.enabled;
		if (typeof body.stock?.channelId !== 'undefined') appConfig.stock.channelId = body.stock.channelId || undefined;
		if (Array.isArray(body.stock?.channels)) appConfig.stock.channels = body.stock.channels.filter((x: unknown) => typeof x === 'string');
		if (Array.isArray(body.stock?.timeframes)) appConfig.stock.timeframes = body.stock.timeframes.filter((x: unknown) => typeof x === 'string');
		log('Config updated via web UI');
		res.json(appConfig);
	});

	app.get('/api/channels', async (_req, res) => {
		try {
			const list: { id: string; name: string }[] = [];
			for (const [, guild] of ctx.client.guilds.cache) {
				const channels = await guild.channels.fetch();
				channels.forEach((ch) => {
					if (!ch) return;
					if (ch.isTextBased()) list.push({ id: ch.id, name: `#${ch.name} (${guild.name})` });
				});
			}
			res.json(list);
		} catch (e) {
			res.status(500).json({ error: String(e) });
		}
	});

	app.post('/api/restart', (_req, res) => {
		log('Restart requested via web UI');
		res.json({ ok: true });
		setTimeout(() => process.exit(0), 200);
	});

	app.listen(port, () => log(`API server listening on http://localhost:${port}`));
}
