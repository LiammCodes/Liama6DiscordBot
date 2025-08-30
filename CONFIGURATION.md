# Configuration System

This Discord bot now supports persistent configuration storage, allowing you to save settings like:

- **Module enable/disable states**
- **Selected Discord channels** for each module
- **Theme preferences** (light/dark/auto mode)
- **Module-specific settings** (Twitch channels, stock timeframes, etc.)

## How It Works

### Configuration Storage
- Configuration is automatically saved to `data/config.json`
- Settings persist between bot restarts
- Default configuration is created on first run

### Configuration Structure

```json
{
  "cards": {
    "enabled": true,
    "channelId": "1234567890123456789",
    "channels": ["1234567890123456789"]
  },
  "twitch": {
    "enabled": true,
    "channelId": "1234567890123456789",
    "channels": ["1234567890123456789"],
    "login": "liama6",
    "pollMs": 60000
  },
  "stock": {
    "enabled": true,
    "channelId": "1234567890123456789",
    "channels": ["1234567890123456789"],
    "timeframes": ["5m", "30m", "1h"]
  },
  "theme": "dark",
  "lastUpdated": "2025-08-29T21:15:00.000Z"
}
```

### API Endpoints

#### GET `/api/config`
Returns the current configuration including theme settings.

#### PUT `/api/config`
Updates configuration and automatically saves to file.

Example request:
```json
{
  "cards": {
    "enabled": false,
    "channelId": "1234567890123456789"
  },
  "theme": "light"
}
```

### Theme Options
- `"light"` - Always use light mode
- `"dark"` - Always use dark mode  
- `"auto"` - Follow system preference

### Module Configuration

Each module supports:
- `enabled`: Boolean to enable/disable the module
- `channelId`: Single channel for module output
- `channels`: Array of channels for multi-channel support

### Docker Configuration

When running in Docker, the configuration file is stored in the mounted `./data` volume:

```yaml
volumes:
  - ./data:/app/data
```

This ensures your configuration persists across container restarts.

## Usage

1. **First Run**: Configuration file is created with defaults
2. **Web UI**: Use the dashboard to modify settings
3. **API**: Direct API calls to update configuration
4. **Manual**: Edit `data/config.json` directly (not recommended)

## File Locations

- **Production**: `./data/config.json`
- **Docker**: `/app/data/config.json` (mounted from `./data`)
- **Example**: `config.example.json`

## Security

- Configuration files are excluded from git (see `.gitignore`)
- Sensitive data like tokens should use environment variables
- Channel IDs are stored as strings (Discord snowflakes)
