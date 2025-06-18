# Console.ext

A powerful logging and notification system designed for developers, particularly in startup environments where downtime can lead to significant revenue loss. Console.ext overrides the standard console object to provide real-time text and call notifications when critical errors occur in your applications.

## 🚀 Features

### Core Functionality
- **Error Notification**: Automatically detects and sends alerts for critical errors in checkout flows and other critical areas
- **Console Override**: Seamlessly overrides `console.log`, `console.error`, and `console.warn` with notification capabilities
- **Custom Text Function**: New `console.text()` method for explicit notifications

### Advanced Features
- **Rate Limiting**: Prevents notification spam with configurable limits (default: 5 notifications per minute)
- **Web Dashboard**: Real-time dashboard for monitoring notifications and managing settings
- **Call Integration**: Automatic phone calls for urgent/critical situations
- **Undelivered Tracking**: Tracks notifications blocked by rate limiting
- **Multi-platform Integration**: Works with DataDog, Winston, and custom webhook services

## 📋 Installation

```bash
git clone <repository-url>
cd Console.ext
npm install
```

## 🔧 Quick Start

### Basic Usage

```javascript
const ConsoleExt = require('./console-ext');
const { createConfig } = require('./config');

// Configure Console.ext
const config = createConfig('production', {
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook-service.com/notify',
    enableText: true,
    enableCall: true,
    rateLimitMax: 5
});

// Initialize
const consoleExt = new ConsoleExt(config);

// Use normally
console.log('Application started');
console.error('Critical error - this will trigger notifications!');
console.text('Manual notification message');

// Restore original console when done
consoleExt.restore();
```

### With Dashboard

```javascript
const ConsoleExt = require('./console-ext');
const DashboardServer = require('./dashboard-server');

const consoleExt = new ConsoleExt(config);
const dashboard = new DashboardServer(consoleExt, 3000);

dashboard.start();
// Dashboard available at http://localhost:3000
```

### With Winston Integration

```javascript
const WinstonConsoleExt = require('./winston-integration');

const winstonConsoleExt = new WinstonConsoleExt({
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook.com/notify',
    logLevel: 'info'
});

const logger = winstonConsoleExt.getLogger();
logger.error('This will be logged and trigger notifications');
```

## ⚙️ Configuration

### Environment Presets

```javascript
const { createConfig } = require('./config');

// Development (notifications disabled)
const devConfig = createConfig('development');

// Production (all notifications enabled)
const prodConfig = createConfig('production', {
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook.com'
});

// Custom configuration
const customConfig = createConfig('default', {
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook.com/notify',
    enableText: true,
    enableCall: true,
    rateLimitWindow: 60000,    // 1 minute
    rateLimitMax: 5,           // 5 notifications per window
    criticalKeywords: ['error', 'fatal', 'critical', 'timeout'],
    dataDogApiKey: 'your-datadog-key'
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `phoneNumber` | string | null | Phone number for text/call notifications |
| `webhookUrl` | string | null | Webhook URL for sending notifications |
| `enableText` | boolean | false | Enable text message notifications |
| `enableCall` | boolean | false | Enable call notifications for critical errors |
| `rateLimitWindow` | number | 60000 | Rate limit window in milliseconds |
| `rateLimitMax` | number | 5 | Maximum notifications per window |
| `criticalKeywords` | array | ['error', 'fatal', 'critical', 'exception'] | Keywords that trigger critical alerts |
| `dataDogApiKey` | string | null | DataDog API key for logging integration |

## 📊 Dashboard

The web dashboard provides:

- **Real-time Statistics**: Sent vs. rate-limited notifications
- **Configuration Management**: Update settings without restarting
- **Notification History**: View all sent and blocked notifications
- **Test Functionality**: Send test notifications
- **Uptime Monitoring**: Track system uptime

Access the dashboard at `http://localhost:3000` when running with dashboard server.

## 🔗 Integrations

### Webhook Services

Console.ext works with any webhook service. Popular options:

- **Twilio**: For SMS and voice calls
- **Zapier**: For connecting to various services
- **Slack**: For team notifications
- **Custom APIs**: Your own notification service

### Logging Platforms

- **DataDog**: Built-in API integration
- **Winston**: Full Winston logger integration
- **Custom**: Easy to extend for other platforms

## 📝 Examples

### Startup Checkout Flow Monitoring

```javascript
// Monitor critical checkout process
function processPayment(paymentData) {
    try {
        const result = chargeCard(paymentData);
        console.log('Payment processed successfully');
        return result;
    } catch (error) {
        // This will trigger immediate notification
        console.error('Payment processing failed:', error.message);
        throw error;
    }
}
```

### Rate Limiting Demo

```javascript
// Simulate multiple errors to see rate limiting
for (let i = 1; i <= 10; i++) {
    setTimeout(() => {
        console.error(`Error ${i} - Critical system failure`);
    }, i * 1000);
}
// First 5 will send notifications, rest will be rate limited
```

## 🚦 Running Examples

```bash
# Basic example
npm start

# Example with dashboard
node example-with-dashboard.js

# Winston integration example
node winston-example.js
```

## 📁 File Structure

```
Console.ext/
├── console-ext.js              # Main Console.ext class
├── config.js                   # Configuration presets
├── dashboard.html              # Web dashboard interface
├── dashboard-server.js         # Dashboard HTTP server
├── winston-integration.js      # Winston logger integration
├── example.js                  # Basic usage example
├── example-with-dashboard.js   # Dashboard example
├── package.json               # Dependencies and scripts
├── README.md                  # This file
└── CLAUDE.md                  # Development instructions
```

## 🛠️ Development

See [CLAUDE.md](./CLAUDE.md) for development setup, testing, and contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and feature requests, please create an issue in the repository.

## 🎯 Use Cases

Perfect for:
- **E-commerce sites**: Monitor checkout and payment flows
- **SaaS applications**: Track critical user actions
- **API services**: Alert on service failures
- **Startup environments**: Immediate notification of revenue-impacting issues
- **Development teams**: Real-time error awareness

## ⚡ Performance

- **Minimal overhead**: Non-blocking notification sending
- **Memory efficient**: Smart rate limiting and cleanup
- **Production ready**: Error handling and graceful degradation