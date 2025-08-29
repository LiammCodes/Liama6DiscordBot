import { Client, Events, Message, TextChannel } from 'discord.js';
import { fetch } from 'undici';
import { appConfig, log } from '../state.js';

const TICKER_PATTERN = /\$([A-Z]{1,5})/g; // $AAPL, $TSLA, etc.

interface StockData {
	symbol: string;
	price: number;
	change: number;
	changePercent: number;
	high: number;
	low: number;
	volume: number;
	previousClose: number;
}

interface AlphaVantageResponse {
	[key: string]: any;
}

async function fetchStockData(ticker: string): Promise<StockData | null> {
	try {
		// Use Alpha Vantage API for current quote
		const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
		const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
		
		log(`📈 Stock: fetching data for $${ticker}`);
		const response = await fetch(url);
		const data = await response.json() as AlphaVantageResponse;
		
		const quote = data['Global Quote'];
		if (!quote) {
			throw new Error('No quote data found');
		}
		
		const price = parseFloat(quote['05. price']);
		const change = parseFloat(quote['09. change']);
		const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
		const high = parseFloat(quote['03. high']);
		const low = parseFloat(quote['04. low']);
		const volume = parseInt(quote['06. volume']);
		const previousClose = parseFloat(quote['08. previous close']);
		
		return {
			symbol: ticker,
			price,
			change,
			changePercent,
			high,
			low,
			volume,
			previousClose
		};
	} catch (error) {
		log(`📈 Stock: API error for $${ticker}: ${String(error)}`);
		return null;
	}
}

function generateBuySellSignal(data: StockData): { signal: string; confidence: string; reasoning: string[] } {
	const reasons: string[] = [];
	let bullishPoints = 0;
	let bearishPoints = 0;
	
	// 1. Price momentum (40% weight)
	if (data.changePercent > 2) {
		bullishPoints += 4;
		reasons.push(`🚀 Strong upward momentum (+${data.changePercent.toFixed(2)}%)`);
	} else if (data.changePercent > 0.5) {
		bullishPoints += 2;
		reasons.push(`📈 Positive momentum (+${data.changePercent.toFixed(2)}%)`);
	} else if (data.changePercent < -2) {
		bearishPoints += 4;
		reasons.push(`📉 Strong downward momentum (${data.changePercent.toFixed(2)}%)`);
	} else if (data.changePercent < -0.5) {
		bearishPoints += 2;
		reasons.push(`🔻 Negative momentum (${data.changePercent.toFixed(2)}%)`);
	} else {
		reasons.push(`➡️ Sideways movement (${data.changePercent.toFixed(2)}%)`);
	}
	
	// 2. Volume analysis (30% weight)
	const avgVolume = 1000000; // Simplified average volume assumption
	if (data.volume > avgVolume * 1.5) {
		bullishPoints += 3;
		reasons.push(`📊 High volume (${(data.volume / 1000000).toFixed(1)}M shares)`);
	} else if (data.volume < avgVolume * 0.5) {
		bearishPoints += 1;
		reasons.push(`📊 Low volume (${(data.volume / 1000000).toFixed(1)}M shares)`);
	} else {
		reasons.push(`📊 Normal volume (${(data.volume / 1000000).toFixed(1)}M shares)`);
	}
	
	// 3. Price relative to daily range (30% weight)
	const dailyRange = data.high - data.low;
	const pricePosition = (data.price - data.low) / dailyRange;
	
	if (pricePosition > 0.8) {
		bearishPoints += 3;
		reasons.push(`⚠️ Trading near daily high (${(pricePosition * 100).toFixed(0)}% of range)`);
	} else if (pricePosition < 0.2) {
		bullishPoints += 3;
		reasons.push(`💡 Trading near daily low (${(pricePosition * 100).toFixed(0)}% of range)`);
	} else {
		reasons.push(`➡️ Mid-range trading (${(pricePosition * 100).toFixed(0)}% of range)`);
	}
	
	// Determine signal
	let signal: string;
	let confidence: string;
	
	if (bullishPoints > bearishPoints + 2) {
		signal = '🟢 BUY';
		confidence = bullishPoints > 6 ? 'HIGH' : 'MEDIUM';
	} else if (bearishPoints > bullishPoints + 2) {
		signal = '🔴 SELL';
		confidence = bearishPoints > 6 ? 'HIGH' : 'MEDIUM';
	} else {
		signal = '🟡 HOLD';
		confidence = 'LOW';
		reasons.push('📊 Mixed signals - consider waiting for clearer direction');
	}
	
	return { signal, confidence, reasoning: reasons };
}

function formatStockResponse(data: StockData, signal: { signal: string; confidence: string; reasoning: string[] }): string {
	const changeEmoji = data.change >= 0 ? '📈' : '📉';
	const changeText = data.change >= 0 ? `+${data.change.toFixed(2)}` : data.change.toFixed(2);
	const percentText = data.changePercent >= 0 ? `+${data.changePercent.toFixed(2)}%` : `${data.changePercent.toFixed(2)}%`;
	
	return `**$${data.symbol}** ${changeEmoji}
💰 **Price:** $${data.price.toFixed(2)} (${changeText}, ${percentText})
📊 **Today's Range:** $${data.low.toFixed(2)} - $${data.high.toFixed(2)}
📈 **Volume:** ${(data.volume / 1000000).toFixed(1)}M shares

${signal.signal} (${signal.confidence} confidence)
${signal.reasoning.map(reason => `• ${reason}`).join('\n')}`;
}

export function registerStockChartFeature(client: Client): void {
	client.on(Events.MessageCreate, async (message: Message) => {
		if (message.author.bot) return;
		if (!message.content) return;
		if (!appConfig.stock.enabled) return;

		// If specific channels configured, ignore others
		if (Array.isArray(appConfig.stock.channels) && appConfig.stock.channels.length > 0) {
			if (!appConfig.stock.channels.includes(message.channelId)) return;
		}

		const matches = [...message.content.matchAll(TICKER_PATTERN)];
		if (matches.length === 0) return;

		log(`📈 Stock: detected ${matches.length} ticker(s) from @${message.author.username} in #${message.channel?.toString?.() ?? 'unknown'}`);

		for (const match of matches) {
			const tickerMatch = match[1];
			if (!tickerMatch) continue;
			const ticker = tickerMatch.toUpperCase();
			
			try {
				const stockData = await fetchStockData(ticker);
				
				if (stockData) {
					const signal = generateBuySellSignal(stockData);
					const response = formatStockResponse(stockData, signal);
					
					// If a channel override is set, post there; else reply inline
					const overrideId = appConfig.stock.channelId || appConfig.stock.channels?.[0];
					if (overrideId) {
						const channel = await client.channels.fetch(overrideId).catch(() => null);
						const textChannel = channel?.isTextBased() ? (channel as TextChannel) : null;
						if (textChannel) {
							await textChannel.send(response);
							log(`📈 Stock: posted analysis to #${textChannel.name || 'unknown'}`);
						} else {
							await message.reply(response);
						}
					} else {
						await message.reply(response);
					}
					log(`📈 Stock: replied with analysis for $${ticker}`);
				} else {
					await message.reply(`📈 Failed to fetch data for **$${ticker}**. Please try again.`);
				}
			} catch (err) {
				log(`📈 Stock: failed to analyze $${ticker}: ${String(err)}`);
				await message.reply(`📈 Error analyzing **$${ticker}**. Please try again.`);
			}
		}
	});
}


