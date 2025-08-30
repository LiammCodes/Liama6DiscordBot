import fs from 'fs/promises';
import path from 'path';
import { appConfig, type AppConfig } from './state.js';

export type Theme = 'light' | 'dark' | 'auto';

export interface PersistentConfig extends AppConfig {
	theme: Theme;
	lastUpdated: string;
}

const CONFIG_FILE = 'config.json';
const CONFIG_PATH = path.join(process.cwd(), 'data', CONFIG_FILE);

export class ConfigManager {
	private config: PersistentConfig;

	constructor() {
		this.config = {
			...appConfig,
			theme: 'auto',
			lastUpdated: new Date().toISOString(),
		};
	}

	async load(): Promise<void> {
		try {
			// Ensure data directory exists
			await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
			
			const data = await fs.readFile(CONFIG_PATH, 'utf-8');
			const savedConfig = JSON.parse(data) as Partial<PersistentConfig>;
			
			// Merge saved config with defaults
			this.config = {
				...this.config,
				...savedConfig,
				lastUpdated: new Date().toISOString(),
			};

			// Update the global appConfig
			Object.assign(appConfig, {
				cards: this.config.cards,
				twitch: this.config.twitch,
				stock: this.config.stock,
			});

			console.log('Configuration loaded from file');
		} catch (error) {
			console.log('No saved configuration found, using defaults');
			await this.save();
		}
	}

	async save(): Promise<void> {
		try {
			// Update the config with current appConfig state
			this.config = {
				...this.config,
				cards: appConfig.cards,
				twitch: appConfig.twitch,
				stock: appConfig.stock,
				lastUpdated: new Date().toISOString(),
			};

			await fs.writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2));
			console.log('Configuration saved to file:', CONFIG_PATH);
			console.log('Saved config:', JSON.stringify(this.config, null, 2));
		} catch (error) {
			console.error('Failed to save configuration:', error);
		}
	}

	getConfig(): PersistentConfig {
		return { ...this.config };
	}

	updateConfig(updates: Partial<PersistentConfig>): void {
		this.config = {
			...this.config,
			...updates,
			lastUpdated: new Date().toISOString(),
		};

		// Update the global appConfig with proper merging
		if (updates.cards) {
			appConfig.cards = {
				...appConfig.cards,
				...updates.cards,
			};
		}
		if (updates.twitch) {
			appConfig.twitch = {
				...appConfig.twitch,
				...updates.twitch,
			};
		}
		if (updates.stock) {
			appConfig.stock = {
				...appConfig.stock,
				...updates.stock,
			};
		}
	}

	getTheme(): Theme {
		return this.config.theme;
	}

	setTheme(theme: Theme): void {
		this.config.theme = theme;
		this.config.lastUpdated = new Date().toISOString();
	}
}

export const configManager = new ConfigManager();
