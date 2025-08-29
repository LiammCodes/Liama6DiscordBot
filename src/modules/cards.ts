import { Client, Events, Message, TextChannel } from 'discord.js';
import { fetch } from 'undici';
import { appConfig, log } from '../state.js';

const CARD_PATTERN = /\[\[([^\]]+)\]\]/g; // [[Card Name]]

function buildScryfallUrl(cardName: string): string {
	const encoded = encodeURIComponent(cardName.trim());
	return `https://scryfall.com/search?q=${encoded}`;
}

type CardLinks = { name: string; sf: string; f2f: string; tcg: string };

async function buildCardLinks(cardName: string): Promise<CardLinks> {
	let sf = buildScryfallUrl(cardName);
	let tcg = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(cardName)}`;
	const f2f = `https://www.facetofacegames.com/search?q=${encodeURIComponent(cardName)}`;

	try {
		const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
		if (res.ok) {
			const data: any = await res.json();
			if (data?.scryfall_uri) sf = data.scryfall_uri as string;
			if (data?.purchase_uris?.tcgplayer) tcg = data.purchase_uris.tcgplayer as string;
		}
	} catch {}

	return { name: cardName, sf, f2f, tcg };
}

export function registerCardLinksFeature(client: Client): void {
	client.on(Events.MessageCreate, async (message: Message) => {
		if (message.author.bot) return;
		if (!message.content) return;
		if (!appConfig.cards.enabled) return;
		// If specific channels configured, ignore others
		if (Array.isArray(appConfig.cards.channels) && appConfig.cards.channels.length > 0) {
			if (!appConfig.cards.channels.includes(message.channelId)) return;
		}

		const matches = [...message.content.matchAll(CARD_PATTERN)];
		if (matches.length === 0) return;

		log(`🧩 Cards: detected ${matches.length} tag(s) from @${message.author.username} in #${message.channel?.toString?.() ?? 'unknown'}`);

		const seen = new Set<string>();
		const names: string[] = [];
		for (const m of matches) {
			const raw = m[1];
			if (!raw) continue;
			const name = raw.trim();
			if (name && !seen.has(name.toLowerCase())) {
				seen.add(name.toLowerCase());
				names.push(name);
			}
		}

		const links = await Promise.all(names.map(buildCardLinks));
		const reply = links
			.map((l) => `${l.name}: [SF](<${l.sf}>) | [F2F](<${l.f2f}>) | [TCG](<${l.tcg}>)`)
			.join('\n');
		if (reply.length === 0) return;

		try {
			// If a channel override is set, post there; else reply inline
			const overrideId = appConfig.cards.channelId || appConfig.cards.channels?.[0];
			if (overrideId) {
				const channel = await client.channels.fetch(overrideId).catch(() => null);
				const textChannel = channel?.isTextBased() ? (channel as TextChannel) : null;
				if (textChannel) {
					await textChannel.send(reply);
					log(`📎 Cards: posted ${links.length} link(s) to #${overrideId}`);
				}
				else await message.reply(reply);
			} else {
				await message.reply(reply);
				log(`📎 Cards: replied with ${links.length} link(s) to @${message.author.username}`);
			}
		} catch (err) {
			log(`Cards module: failed to post reply: ${String(err)}`);
		}
	});
}


