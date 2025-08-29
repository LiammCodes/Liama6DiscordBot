import 'dotenv/config';
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { registerCardLinksFeature } from './modules/cards';
import { registerTwitchLiveNotifier } from './modules/twitch';
import { registerStockChartFeature } from './modules/stock';
import { appConfig, log } from './state.js';
import { startApiServer } from './api.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
	console.error('Missing DISCORD_TOKEN in environment');
	process.exit(1);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
	log(`Ready! Logged in as ${c.user.tag}`);
	registerCardLinksFeature(client);
	await registerTwitchLiveNotifier(client);
	registerStockChartFeature(client);
	startApiServer({ client });
});

client.login(token);
