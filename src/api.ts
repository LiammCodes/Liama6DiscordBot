import express from 'express';
import cors from 'cors';
import { logs, appConfig, log } from './state.js';
import { configManager } from './config.js';
import type { Client } from 'discord.js';

export function startApiServer(ctx: { client: Client }, port = Number(process.env.API_PORT || 3000)) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get('/api/logs', (_req, res) => {
		res.json(logs.toArray());
	});

	app.get('/api/config', (_req, res) => {
		res.json(configManager.getConfig());
	});

	app.put('/api/config', async (req, res) => {
		const body = req.body || {};
		
		// Update configuration
		configManager.updateConfig(body);
		
		// Save to file
		await configManager.save();
		
		log('Config updated via web UI');
		res.json(configManager.getConfig());
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

	app.listen(port, '0.0.0.0', () => log(`API server listening on http://0.0.0.0:${port}`));
}
