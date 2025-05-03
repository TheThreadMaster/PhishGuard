# PhishGuard Browser Extension

A real-time phishing link detection and blocking browser extension with a modern UI similar to Brave browser.

## Features

- Real-time phishing link detection
- Suspicious domain blocking
- Whitelist and blacklist management
- Modern, user-friendly interface
- Strict mode for enhanced protection
- Detailed statistics and reporting

## Installation

1. Download or clone this repository
2. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

### Basic Protection

The extension will automatically:
- Monitor all links on web pages
- Check for suspicious patterns in URLs
- Block known phishing domains
- Show warnings for potentially dangerous sites

### Popup Interface

Click the extension icon to:
- View protection status
- See statistics (links checked, threats blocked)
- Toggle protection on/off
- Enable/disable strict mode
- Whitelist current site

### Settings Page

Access detailed settings by:
1. Right-click the extension icon
2. Select "Options"

In the settings page, you can:
- Manage whitelist and blacklist
- Configure strict mode
- Toggle notifications
- View detailed statistics

## Development

### Project Structure

```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── options.html
├── options.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building

No build step is required. The extension can be loaded directly in developer mode.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 