# Console.ext Development Guide

This file contains development instructions and context for working with Console.ext using Claude Code.

## 🎯 Project Overview

Console.ext is a logging and notification system that overrides the console object to provide real-time text and call notifications for critical errors. This is particularly valuable for startup environments where downtime leads to revenue loss.

## 🏗️ Architecture

### Core Components

1. **console-ext.js**: Main library with console override and notification logic
2. **config.js**: Configuration management with environment presets
3. **dashboard.html + dashboard-server.js**: Web-based monitoring dashboard
4. **winston-integration.js**: Integration with Winston logging framework

### Key Features Implemented

- ✅ Console object override (log, error, warn, text)
- ✅ Rate limiting to prevent notification spam
- ✅ Real-time web dashboard for monitoring
- ✅ Call functionality for urgent situations
- ✅ DataDog logging integration
- ✅ Winston logger integration
- ✅ Undelivered notification tracking
- ✅ Configurable critical error detection

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 12.0.0
- npm

### Installation
```bash
cd /Users/arvindiyer/Projects/Console.ext
npm install
```

### Dependencies
- **winston**: ^3.17.0 (logging framework integration)

## 🧪 Testing

### Manual Testing Commands

```bash
# Basic functionality test
npm start

# Dashboard integration test
node example-with-dashboard.js

# Winston integration test (if implemented)
node winston-integration.js
```

### Testing Rate Limiting
The rate limiting can be tested by running multiple error logs in quick succession. Default: 5 notifications per minute.

### Testing Dashboard
1. Run `node example-with-dashboard.js`
2. Open `http://localhost:3000`
3. Observe real-time notification statistics
4. Test configuration updates via dashboard

## 🔧 Configuration

### Environment Presets
- **development**: Notifications disabled, debug logging
- **production**: All notifications enabled, error-level logging
- **default**: Base configuration template

### Critical Keywords
Default keywords that trigger notifications:
- error, fatal, critical, exception, crash, fail, timeout
- unauthorized, forbidden, server error, database error, connection lost

## 📋 Common Development Tasks

### Adding New Notification Channels

1. Extend the `sendNotification` method in `console-ext.js`
2. Add configuration options in `config.js`
3. Update dashboard UI if needed
4. Test with example scripts

### Modifying Rate Limiting

Rate limiting logic is in the `shouldSendNotification` method:
- Tracks notifications per phone number and type
- Uses sliding window approach
- Configurable via `rateLimitWindow` and `rateLimitMax`

### Dashboard Enhancements

Dashboard files:
- `dashboard.html`: Frontend interface
- `dashboard-server.js`: Backend API server
- API endpoints: `/`, `/api/stats`, `/api/config`

### Logging Integration

Current integrations:
- **DataDog**: Via REST API in `sendToDataDog` method
- **Winston**: Via `winston-integration.js` wrapper class

## 🐛 Debugging

### Common Issues

1. **Webhook Failures**: Expected with placeholder URLs like `your-webhook-service.com`
   - Replace with real webhook service URL
   - Test with services like webhook.site for development

2. **Rate Limiting Not Working**: 
   - Check `rateLimitWindow` and `rateLimitMax` configuration
   - Verify timestamps in `rateLimitTracker`

3. **Dashboard Not Loading**:
   - Ensure port 3000 is available
   - Check `dashboard-server.js` is properly started
   - Verify `consoleExtInstance` is passed correctly

### Debug Logging

The system includes error logging for notification failures:
- Webhook failures are logged but don't crash the system
- Original console methods are preserved and accessible

## 📁 File Structure

```
/Users/arvindiyer/Projects/Console.ext/
├── console-ext.js              # Main Console.ext class (150 lines)
├── config.js                   # Configuration presets (60 lines)
├── dashboard.html              # Web dashboard (300+ lines)
├── dashboard-server.js         # HTTP server for dashboard (80 lines)
├── winston-integration.js      # Winston integration (70 lines)
├── example.js                  # Basic example (30 lines)
├── example-with-dashboard.js   # Dashboard example (40 lines)
├── package.json               # NPM configuration
├── README.md                  # User documentation
└── CLAUDE.md                  # This development guide
```

## 💡 Future Enhancements

### Potential Improvements
1. **Database Storage**: Persist notifications and statistics
2. **User Authentication**: Secure dashboard access
3. **Multiple Recipients**: Support notification distribution lists
4. **Custom Webhook Templates**: Configurable message formats
5. **Metric Visualization**: Charts and graphs in dashboard
6. **Mobile Dashboard**: Responsive design improvements
7. **Slack/Discord Integration**: Direct messaging platform support
8. **Health Checks**: System monitoring and alerting

### Performance Optimizations
1. **Batch Notifications**: Group similar notifications
2. **Async Queue**: Background notification processing
3. **Memory Management**: Automatic cleanup of old notifications
4. **Caching**: Cache frequently accessed configuration

## 🔄 Deployment

### Production Considerations
1. **Webhook Services**: Use reliable services like Twilio, SendGrid
2. **Environment Variables**: Store sensitive config (API keys, phone numbers)
3. **Error Handling**: Ensure notification failures don't affect main application
4. **Monitoring**: Monitor the monitoring system itself
5. **Security**: Validate webhook payloads, secure dashboard access

### Environment Variables (Recommended)
```bash
CONSOLE_EXT_PHONE_NUMBER=+1234567890
CONSOLE_EXT_WEBHOOK_URL=https://your-webhook.com/notify
CONSOLE_EXT_DATADOG_API_KEY=your-datadog-key
CONSOLE_EXT_RATE_LIMIT_MAX=5
CONSOLE_EXT_RATE_LIMIT_WINDOW=60000
```

## 📚 Code Patterns

### Adding New Methods
```javascript
// In console-ext.js constructor
console.newMethod = function(...args) {
    self.originalConsole.log('[NEW_METHOD]', ...args);
    self.processMessage('info', args);
};
```

### Configuration Extension
```javascript
// In config.js
const newPreset = {
    ...defaultConfig,
    newFeature: true,
    newSetting: 'value'
};
```

### Dashboard API Extension
```javascript
// In dashboard-server.js
else if (url === '/api/new-endpoint') {
    this.handleNewEndpoint(req, res);
}
```

## 🧪 Test Scenarios

### Rate Limiting Test
```javascript
// Generate 10 errors rapidly
for (let i = 1; i <= 10; i++) {
    console.error(`Test error ${i}`);
}
// First 5 should send, rest should be rate limited
```

### Dashboard Test
1. Start dashboard server
2. Generate various notification types
3. Verify real-time updates
4. Test configuration changes
5. Check undelivered notification tracking

### Integration Test
1. Configure real webhook URL (webhook.site)
2. Test actual notification delivery
3. Verify DataDog integration (if API key provided)
4. Test Winston logging integration

## 🔐 Security Notes

- Never commit real API keys or phone numbers
- Validate all webhook payloads in production
- Implement authentication for dashboard in production
- Use HTTPS for all webhook communications
- Rate limit dashboard API endpoints

## 📞 Webhook Integration Examples

### Twilio Integration
```javascript
// Webhook payload for Twilio
{
    action: 'send_text',
    to: '+1234567890',
    message: 'Critical error detected',
    timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Slack Integration
```javascript
// Webhook payload for Slack
{
    text: 'Console.ext Alert',
    attachments: [{
        color: 'danger',
        text: 'Critical error detected in production'
    }]
}
```

This development guide should help you understand, maintain, and extend the Console.ext system effectively.