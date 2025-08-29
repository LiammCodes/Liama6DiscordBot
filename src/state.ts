import { Client } from 'discord.js';

export type ModuleConfig = {
	enabled: boolean;
	channelId?: string; // legacy single-channel post target
	channels?: string[]; // for modules that listen/post per-channel
};

export type AppConfig = {
	cards: ModuleConfig;
	twitch: ModuleConfig & {
		login: string;
		pollMs: number;
	};
	stock: ModuleConfig & {
		timeframes: string[];
	};
};

export class RingBuffer<T> {
	private readonly buffer: T[] = [];
	private readonly maxSize: number;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
	}

	push(item: T) {
		this.buffer.push(item);
		if (this.buffer.length > this.maxSize) this.buffer.shift();
	}

	toArray(): T[] {
		return [...this.buffer];
	}
}

export const logs = new RingBuffer<string>(500);

export function log(message: string) {
	const timestamp = new Date().toISOString();
	const line = `[${timestamp}] ${message}`;
	console.log(line);
	logs.push(line);
}

export const appConfig: AppConfig = {
	cards: {
		enabled: true,
	},
	twitch: {
		enabled: true,
		...(process.env.TWITCH_ANNOUNCE_CHANNEL_ID ? { channelId: process.env.TWITCH_ANNOUNCE_CHANNEL_ID } : {}),
		login: process.env.TWITCH_CHANNEL_LOGIN || 'liama6',
		pollMs: Number(process.env.TWITCH_POLL_MS || 60_000),
	},
	stock: {
		enabled: true,
		timeframes: ['5m', '30m', '1h'],
	},
};

export type AppContext = {
	client: Client;
	config: AppConfig;
	log: (msg: string) => void;
};


