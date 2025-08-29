## Liama6DiscordBot

A modular TypeScript Discord bot with:
- Magic card linking (Scryfall, FaceToFace, TCGplayer) via `[[Card Name]]`
- Twitch live notifications to a channel

### Setup
1. Create a Discord bot at the Developer Portal and invite it to your server with the `messages.read` intent enabled.
2. Create `.env` and set values as needed:
```
DISCORD_TOKEN=your_discord_bot_token
# Twitch (recommended for reliable checks)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_CHANNEL_LOGIN=liama6
TWITCH_ANNOUNCE_CHANNEL_ID=697876428490014790
TWITCH_POLL_MS=60000
```

### Install
```bash
npm install
```

### Run in dev
```bash
npm run dev
```

### Build and start
```bash
npm run build
npm start
```

### Usage
Send a message like:
```
I love [[Lightning Bolt]] and [[Black Lotus]]
```
The bot replies with provider links for each card.

When your Twitch channel goes live, the bot posts one of five random "WE ARE LIVE" variations plus your link in the announce channel.
