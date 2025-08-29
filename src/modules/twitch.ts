import { Client, TextChannel } from 'discord.js';
import { fetch } from 'undici';
import { appConfig, log } from '../state.js';

const TWITCH_CHANNEL_LOGIN = appConfig.twitch.login;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';
const TWITCH_ANNOUNCE_CHANNEL_ID = appConfig.twitch.channelId || '697876428490014790';
const TWITCH_POLL_MS = appConfig.twitch.pollMs;

const LIVE_MESSAGES = [
	'WE ARE LIVE',
	'GET IN HERE',
	'RARE LiamA6 Livestream Experience',
    'streaming now :3'
];

let lastWasLive = false;

async function getAppAccessToken(): Promise<string | null> {
	if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;
	try {
		const res = await fetch(`https://id.twitch.tv/oauth2/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: TWITCH_CLIENT_ID,
				client_secret: TWITCH_CLIENT_SECRET,
				grant_type: 'client_credentials',
			}).toString(),
		});
		if (!res.ok) return null;
		const data: any = await res.json();
		return data.access_token as string;
	} catch {
		return null;
	}
}

async function checkIsLive(token: string | null): Promise<boolean> {
	try {
		const url = new URL('https://api.twitch.tv/helix/streams');
		url.searchParams.set('user_login', TWITCH_CHANNEL_LOGIN);
		const headers: Record<string, string> = {};
		if (token && TWITCH_CLIENT_ID) {
			headers['Client-Id'] = TWITCH_CLIENT_ID;
			headers['Authorization'] = `Bearer ${token}`;
		}
		const res = await fetch(url, { headers });
		if (!res.ok) return false;
		const data: any = await res.json();
		const isLive = Array.isArray(data.data) && data.data.length > 0;
		return isLive;
	} catch {
		return false;
	}
}

function pickLiveMessage(): string {
	const idx = Math.floor(Math.random() * LIVE_MESSAGES.length);
	return LIVE_MESSAGES[idx] ?? 'WE ARE LIVE';
}

export async function registerTwitchLiveNotifier(client: Client): Promise<void> {
	if (!appConfig.twitch.enabled) return;
	
	// Get all configured channels (legacy single channel or new multi-channel)
	const channelIds = Array.isArray(appConfig.twitch.channels) && appConfig.twitch.channels.length > 0 
		? appConfig.twitch.channels 
		: appConfig.twitch.channelId 
			? [appConfig.twitch.channelId] 
			: [];

	if (channelIds.length === 0) {
		log('Twitch notifier: no channels configured');
		return;
	}

	let appToken: string | null = await getAppAccessToken();
	if (!appToken) {
		log('Twitch notifier: missing TWITCH_CLIENT_ID/SECRET, falling back to unauthenticated checks');
	}

	async function tick() {
		const isLive = await checkIsLive(appToken);
		if (isLive && !lastWasLive) {
			const msg = `${pickLiveMessage()} https://twitch.tv/${TWITCH_CHANNEL_LOGIN}`;
			
			// Post to all configured channels
			for (const channelId of channelIds) {
				try {
					const channel = await client.channels.fetch(channelId).catch(() => null);
					const textChannel = channel?.isTextBased() ? (channel as TextChannel) : null;
					if (textChannel) {
						await textChannel.send(msg);
						log(`🔴 Twitch: posted live announcement to #${textChannel.name}`);
					}
				} catch (e) {
					log(`Twitch notifier: failed to send to ${channelId}: ${String(e)}`);
				}
			}
			log('🔴 Twitch: stream went live, announcements posted');
		}
		if (!isLive && lastWasLive) {
			log('⚫ Twitch: stream is offline');
		}
		lastWasLive = isLive;
	}

	await tick();
	setInterval(tick, TWITCH_POLL_MS);
}


